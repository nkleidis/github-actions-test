const github = require('@actions/github');
const core = require('@actions/core');

const mainBranch = 'main';

function getTitle() {
  return github.context.payload.pull_request.title;
}

async function run() {
  console.log("Retrieving PR title...")
  console.log(`PR title:: ${getTitle()}`);
  console.log(JSON.stringify(github.context.payload.pull_request))
  const targetBranch = github.context.payload.pull_request.base.ref;
  const isMerged = github.context.payload.pull_request.merged;
  let newTicketStatus = 'TODO';
  if(targetBranch === mainBranch) {
    if(isMerged) {
      console.log('should move tickets to QA column');
      newTicketStatus = 'QA';
    } else {
      console.log('should move tickets to in review column');
      newTicketStatus = 'In Review';
    }
  } else {
    console.log('should move tickets to in progress column');
  }
  console.log('New tickets status:', newTicketStatus);
}

run().catch(e => core.setFailed(e));