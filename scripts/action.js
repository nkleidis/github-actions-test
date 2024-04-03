const github = require('@actions/github');
const core = require('@actions/core');

function getTitle() {
  return github.context.payload.pull_request.title;
}

async function run() {
  console.log("Retrieving PR title...")
  console.log(`PR title:: ${getTitle()}`);
  console.log(JSON.stringify(github.context.payload.pull_request))
  const targetBranch = github.context.payload.pull_request.base.ref;
  if(targetBranch === 'master') {
    console.log('should move tickets to in review column');
  } else {
    console.log('should move tickets to in progress column');
  }
}

run().catch(e => core.setFailed(e));