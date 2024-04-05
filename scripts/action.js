const github = require('@actions/github');
const core = require('@actions/core');

const MAIN_BRANCH = 'main';
const SPACE_PREFIX = "MOB";
const TEAM_ID= '9015210430'
const API_KEY = process.env.CLICKUP_API_KEY

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

  const targetBranch = pullRequestData.base.ref;
  const isDraft = pullRequestData.draft;
  const isMerged = pullRequestData.merged;
  const isClosed = pullRequestData.state === 'closed' && !isMerged;

  console.log({isDraft, isMerged, isClosed, targetBranch})
  if (isMerged && targetBranch !== MAIN_BRANCH) {
    console.log('PR is merged but not to main branch. No action needed.');
    return;
  }

  let newTaskStatus;
  if(isClosed) {
    newTaskStatus = 'open'
  } else if(isDraft) {
    newTaskStatus = 'in progress'
  } else if(isMerged && targetBranch === MAIN_BRANCH) {
    newTaskStatus = 'qa'
  } else {
    newTaskStatus = 'in review'
  }
  console.log('New tickets status:', newTaskStatus);
  const title = pullRequestData.title

  const taskIds = getTaskIds(title);
  if (taskIds.length === 0) {
    console.log('No task IDs found in the PR title.');
    return;
  }
  const promises = taskIds.map(taskId =>
    setStatusToTask({ taskId, status: newTaskStatus})
  );
  await Promise.all(promises);
  console.log('All tasks updated successfully!');
}

async function setStatusToTask({taskId, status}) {
  const query = new URLSearchParams({
    custom_task_ids: 'true',
    team_id: TEAM_ID
  }).toString();

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}?${query}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY
      },
      body: JSON.stringify({ status })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.log(`Failed to update task: ${taskId}`, data);
    return;
  }

  console.log(`Task ${taskId} updated to ${status}`);
}

/**
 * Extracts task IDs from a given string
 *
 * @param title the PR title
 * @returns {Array<string>}
 */
function getTaskIds(title) {
  const regex = new RegExp(`${SPACE_PREFIX}-(\\d+)`, 'g');
  const matches = title.match(regex);
  return matches ? [...new Set(matches)] : []; // Use Set for unique elements
}

handlePullRequestAction().catch(e => core.setFailed(e));
