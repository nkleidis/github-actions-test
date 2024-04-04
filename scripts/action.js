import github from '@actions/github';
import core from '@actions/core';

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
  const isClosed = github.context.payload.pull_request.state === 'closed';
  if (isClosed && !isMerged) {
    console.log('PR is closed but not merged. No action needed.');
    return;
  }

  let newTicketStatus = 'In progress';
  if(targetBranch === mainBranch) {
    if(isMerged) {
      console.log('should move tickets to QA column');
      newTicketStatus = 'QA';
    } else {
      console.log('should move tickets to in review column');
      newTicketStatus = 'In Review';
    }
  }
  console.log('New tickets status:', newTicketStatus);
}

run().catch(e => core.setFailed(e));