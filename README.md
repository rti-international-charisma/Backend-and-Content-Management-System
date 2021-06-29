# CMS for Charisma


## Local Environment setup

- Clone the repo
- From the terminal type `npx create-directus-project example-project`
- Follow instructions to set up the user and project 
- Type `npx directus start` to start the app
- App will start on `http://localhost:8055`

  
### Reference to use the CMS
- https://docs.directus.io/getting-started/quickstart/

## Setup on AWS

### Setup
- Its uses the github actions and task definitions from the repo
- The current setup uses POSTGRES, Directus 9 and REDIS Cache docker images
- S3 for assets
- Systems Manager for environment variables


### Steps
- Execute the github actions either for staging or production
- The action will set up the env on staging or production respectively
- Admin Login details are present in AWS System parameters
