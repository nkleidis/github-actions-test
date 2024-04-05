const github = require('@actions/github');
const core = require('@actions/core');

const mainBranch = 'main';
const SPACE_PREFIX = "MOB";

/*
  Action Plan:
    Action  | Target Branch   | New Status
    -------------------------------
    Open    | any             | IN REVIEW
    merged  | master          | QA
    merged  | other           | Do nothing
    closed  | any             | OPEN
    draft   | any             | IN PROGRESS

    Available Statuses in MOB team:
    'open', 'in progress', 'investigating', 'in review', 'qa', 'cancelled', 'completed'
 */
async function handlePullRequestAction() {
  const pullRequestData = github.context.payload.pull_request;
  console.log(JSON.stringify(pullRequestData))
  console.log("key:", process.env.CLICKUP_API_KEY)
  const targetBranch = pullRequestData.base.ref;
  const isDraft = pullRequestData.draft;
  const isMerged = pullRequestData.merged;
  const isClosed = pullRequestData.state === 'closed' && !isMerged;

  console.log({isDraft, isMerged, isClosed, targetBranch})
  if (isMerged && targetBranch !== mainBranch) {
    console.log('PR is merged but not to main branch. No action needed.');
    return;
  }
  let newTicketStatus;
  if(isClosed) {
    newTicketStatus = 'open'
  } else if(isDraft) {
    newTicketStatus = 'in progress'
  } else if(isMerged && targetBranch === mainBranch) {
    newTicketStatus = 'qa'
  } else {
    newTicketStatus = 'in review'
  }
  console.log('New tickets status:', newTicketStatus);
  const title = pullRequestData.title

  console.log("Retrieving PR title...")
  console.log(`PR title:: ${title}`);
  console.log("ticketsFound:", getTicketIds(title));
}

/**
 * Extracts ticket IDs from a commit message
 *
 * @param message the commit message
 * @returns {Set<string>}
 */
function getTicketIds(message) {
  const regex = new RegExp(`${SPACE_PREFIX}-(\\d+)`, 'g');
  const matches = message.match(regex);
  return matches ? new Set(matches) : new Set(); // Use Set for unique elements
}

handlePullRequestAction().catch(e => core.setFailed(e));
