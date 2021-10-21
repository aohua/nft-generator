## Prerequisite
1. Create an account on Heroku
2. Install Heroku and login through CLI

## Run on localhost
> heroku local web
# for first time execution, create the database first
> localhost:5000/init

## Create and run remote server and database
# Server
> heroku ps:scale web=1
> heroku open
# Database
> heroku addons:create heroku-postgresql:hobby-dev

## Run on Heroku server
# NOTE: Server resided on a sub folder. To push code use the following command on the root directory
> #commit to local first
> git subtree push --prefix backend heroku master
> heroku ps:scale web=1
> heroku open

## DB record
# Create
> create table nftrecord (url text, created_on timestamp);
# insert 1 record
> insert into nftrecord values ('https://ipfs.io/ipfs/bafybeifkkn4ddunvmxvc6llearqx3pehz55ightxr7cc4bim62j7w6txjm/result.jpeg', NOW());
# select statement
> select * from nftrecord order by created_on desc;