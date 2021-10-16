## Prerequisite
1. Create an account on Heroku
2. Install Heroku and login through CLI

## Run on localhost
> heroku local web

## Run on Heroku server
# NOTE: Server resided on a sub folder. To push code use the following command on the root directory
> #commit to local first
> git subtree push --prefix backend heroku master
> heroku ps:scale web=1
> heroku open