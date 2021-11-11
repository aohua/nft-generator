import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { createWorker } from "./workers/createWorker";
import * as tf from "@tensorflow/tfjs";
import * as ColorizationWorker from "./workers/colorization.worker";
import * as StyleWorker from "./workers/style.worker";
import * as SliceWorker from "./workers/asyncSlice.worker";
import debounce from "./utils/debounce";
import Logo from "./assets/logo.png";
import styles from "./styles.module.css";
import test from "./test-images/test.jpeg";
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

function App() {
  let saveableCanvas: CanvasDraw | null = null;
  const colorizationCanvas = useRef(null);
  const styleCanvas = useRef(null);
  const [colorImageDataURL, setColorImageDataURL] = useState<string>("");
  const [colorLoading, setColorLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [styleImageData, setStyleImageData] = useState<
    Uint8Array | Float32Array | Int32Array | null
  >();
  const [enableStyleModel, setEnableStyleModel] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const onDrawing = debounce(() => {
    if (saveableCanvas) {
      const dataUrl = (saveableCanvas as any).getDataURL(
        "jpg",
        false,
        "#ffffff"
      );
      setColorImageDataURL(dataUrl);
    }
  }, 2000);
  const fetchImages = () => {
    fetch("https://nftgan.herokuapp.com/nft")
      .then((res) => {
        return res.json();
      })
      .then((response: { results: Image[] }) => {
        setImages(response.results);
      });
  };
  // init
  useEffect(() => {
    onDrawing();
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setColorLoading(true);
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
        <h1>Draw it yourself</h1>
        <p style={{ fontSize: 20 }}>
          Our drawing board is baseded on 2 GAN model
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
            onDrawing();
          }}
        >
          clear
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            saveableCanvas?.undo();
            onDrawing();
          }}
        >
          undo
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            setEnableStyleModel(true);
            onDrawing();
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
          onChange={onDrawing}
          brushRadius={2}
          lazyRadius={1}
          hideGrid={true}
          style={{ margin: 20 }}
          imgSrc={test}
          className={`${styles.border} canvas-draw`}
        />
        <div
          className={colorLoading ? styles.rainbow : styles.border}
          style={{ margin: 20 }}
        >
          <canvas width="400px" height="400px" ref={colorizationCanvas} />
        </div>
        <div
          className={styleLoading ? styles.rainbow : styles.border}
          style={{ margin: 20 }}
        >
          <canvas width="400px" height="400px" ref={styleCanvas} />
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
            saveableCanvas?.undo();
            onDrawing();
          }}
        >
          upload NFT
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
