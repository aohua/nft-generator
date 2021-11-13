import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { createWorker } from "./workers/createWorker";
import * as tf from "@tensorflow/tfjs";
import * as ColorizationWorker from "./workers/colorization.worker";
import * as StyleWorker from "./workers/style.worker";
import * as SliceWorker from "./workers/asyncSlice.worker";
import { useDebounce } from "./utils/debounce";
import Logo from "./assets/logo.png";
import styles from "./styles.module.css";
import test from "./test-images/test.jpg";
import train from "./test-images/train.jpg";
import "./App.css";

let colorizarionWorker = createWorker(ColorizationWorker);
let styleWorker = createWorker(StyleWorker);
let sliceWorker = createWorker(SliceWorker);

type Image = { created_on: string; url: string };

const redrawCanvas = async (
  canvas: HTMLCanvasElement,
  imageData: Uint8ClampedArray
) => {
  const dataArr = await sliceWorker.toArray(imageData);
  tf.tidy(() => {
    if (dataArr) {
      tf.browser.toPixels(tf.tensor3d(dataArr, [400, 400, 4], "int32"), canvas);
    }
  });
};
const URL = "https://nftgan.herokuapp.com/nft";

function App() {
  let saveableCanvas: CanvasDraw | null = null;
  const colorizationCanvas = useRef<HTMLCanvasElement>(null);
  const styleCanvas = useRef<HTMLCanvasElement>(null);
  const [colorLoading, setColorLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [styleImageData, setStyleImageData] = useState<
    Uint8Array | Float32Array | Int32Array | null
  >();
  const [enableStyleModel, setEnableStyleModel] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [bg, setBg] = useState<string>("");

  const fetchImages = () => {
    fetch(URL)
      .then((res) => {
        return res.json();
      })
      .then((response: { results: Image[] }) => {
        setImages(response.results);
      });
  };
  const getDataURL = () =>
    (saveableCanvas as any).getDataURL("jpg", false, "#ffffff");
  const [dataUrl, setDataUrl] = useState("");
  const colorImageDataURL = useDebounce(dataUrl, 2000);
  const uploadCanvasData = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      canvas.toBlob((blob) => {
        const formData = new FormData();
        if (blob) {
          formData.append("nft_file", blob);
          formData.append("name", "NFT-image");
          formData.append("description", "my NFT-image");
          fetch(URL, { method: "post", body: formData })
            .then((response) => response.json())
            .then((result) => {
              fetchImages();
              alert("image uploaded!");
            })
            .catch(() => {
              alert("upload failed!");
            });
        }
      });
    }
  };

  // init
  useEffect(() => {
    setDataUrl(getDataURL());
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveableCanvas?.clear();
  }, [bg, saveableCanvas]);

  useEffect(() => {
    if (colorImageDataURL) {
      setColorLoading(true);
    }
    tf.tidy(() => {
      const result = colorizarionWorker.predict(colorImageDataURL);
      result.then(async (res) => {
        if (res) {
          const { displayData, rawData } = res;
          setStyleImageData(rawData);
          requestIdleCallback(() => {
            if (
              colorizationCanvas &&
              colorizationCanvas.current &&
              displayData
            ) {
              redrawCanvas(colorizationCanvas.current, displayData);
              setColorLoading(false);
            }
          });
        }
      });
    });
  }, [colorImageDataURL]);

  useEffect(() => {
    if (enableStyleModel) {
      setStyleLoading(true);
    }
    tf.tidy(() => {
      if (enableStyleModel) {
        const result = styleWorker.predict(styleImageData);
        result.then((res) => {
          requestIdleCallback(() => {
            if (styleCanvas && styleCanvas.current && res && styleImageData) {
              redrawCanvas(styleCanvas.current, res);
              setEnableStyleModel(false);
              setStyleLoading(false);
            }
          });
        });
      }
    });
  }, [styleImageData, enableStyleModel]);

  const saveableCanvasRefs = document.getElementsByClassName("canvas-draw");
  if (saveableCanvasRefs.length > 0) {
    (saveableCanvasRefs[0] as HTMLCanvasElement).style.removeProperty(
      "background"
    );
  }
  console.log("bg", bg);
  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={Logo}
          alt="logo"
          style={{ width: 60, marginTop: 20, borderRadius: "50%" }}
        />
      </div>

      <div>
        <h1>NFTGan - Draw Masterful Art Pieces</h1>
        <p style={{ fontSize: 20 }}>
          This application shows the potential of using{" "}
          <b>Generative Adversarial Network (GAN)</b> to generate artwork. We
          used both <b>Pix2Pix</b> and <b>CycleGAN</b> for this demo
        </p>

        <a
          className="github-button"
          href="https://github.com/aohua/nft-generator"
          data-color-scheme="no-preference: light; light: light; dark: dark;"
          data-icon="octicon-star"
          aria-label="Star aohua/nft-generator on GitHub"
        >
          Star
        </a>
        <span> </span>
        <a
          className="github-button"
          href="https://github.com/aohua"
          data-color-scheme="no-preference: light; light: light; dark: dark;"
          aria-label="Follow @aohua on GitHub"
        >
          Follow us
        </a>
        <p>
          Created by: <b>Aohua</b> and <b>Jeremy</b> (alphabetical order)
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <button
          onClick={() => {
            saveableCanvas?.clear();
            setDataUrl(getDataURL());
          }}
        >
          clear
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            saveableCanvas?.undo();
            setDataUrl(getDataURL());
          }}
        >
          undo
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            setBg(test);
          }}
        >
          test shadow
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            setBg(train);
          }}
        >
          train shadow
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            setEnableStyleModel(true);
          }}
        >
          generate art piece
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "16px 40px",
          flexWrap: "wrap",
        }}
      >
        <CanvasDraw
          ref={(canvasDraw) => (saveableCanvas = canvasDraw)}
          onChange={() => setDataUrl(getDataURL())}
          brushRadius={2}
          lazyRadius={1}
          hideGrid={true}
          style={{ margin: 20 }}
          imgSrc={bg}
          canvasWidth={410}
          canvasHeight={410}
          className={`${styles.border} canvas-draw`}
        />
        <div
          className={colorLoading ? styles.rainbow : styles.border}
          style={{ margin: 20, height: 410 }}
        >
          <canvas
            width="400px"
            height="400px"
            style={{ borderRadius: 10 }}
            ref={colorizationCanvas}
          />
        </div>
        <div
          className={styleLoading ? styles.rainbow : styles.border}
          style={{ margin: 20, height: 410 }}
        >
          <canvas
            width="400px"
            height="400px"
            style={{ borderRadius: 10 }}
            ref={styleCanvas}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 40,
        }}
      >
        <button
          onClick={() => {
            fetchImages();
          }}
        >
          refresh drawings
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            if (colorizationCanvas.current) {
              uploadCanvasData(colorizationCanvas.current);
            }
          }}
        >
          upload NFT(color)
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            if (styleCanvas.current) {
              uploadCanvasData(styleCanvas.current);
            }
          }}
        >
          upload NFT(color and style)
        </button>
      </div>
      <h2>Gallary</h2>
      <p>Uploaded by others</p>
      <div className={styles.gallary}>
        {images.map((img, index) => {
          return (
            <img
              key={img.url + index}
              style={{ width: 256, height: 256, margin: 8 }}
              src={img.url}
              alt="NFT"
            />
          );
        })}
      </div>
    </div>
  );
}

export default App;
