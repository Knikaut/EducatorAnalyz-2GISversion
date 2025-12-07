/**
 * Service to interact with the Apify API.
 * We use the 'apify/instagram-scraper' to get posts, engagement, and detailed stats.
 * This provides a much more realistic view of the university than just the profile bio.
 */

const APIFY_API_URL = 'https://api.apify.com/v2';
// Using the more robust scraper that fetches posts/media
const ACTOR_ID = 'apify~instagram-scraper'; 

/**
 * Runs the Apify scraper for a specific Instagram handle.
 */
export const runApifyScraper = async (handle: string): Promise<string> => {
  // Use process.env which is polyfilled in index.html if needed
  const APIFY_TOKEN = process.env.VITE_APIFY_TOKEN;

  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_KEY is missing. Please check your environment variables (VITE_APIFY_TOKEN).");
  }

  // 1. Start the Actor Run
  // We request 'posts' to get engagement data (likes, comments count) and content quality
  let startResponse;
  try {
    startResponse = await fetch(`${APIFY_API_URL}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${handle}/`],
        resultsType: "posts",
        resultsLimit: 12, // Analyze last 12 posts to get a trend
        searchType: "hashtag",
        // CRITICAL UPDATE: Using RESIDENTIAL proxies is required to avoid Instagram blocks.
        // This setting works best with a Paid Apify Plan.
        proxy: { 
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"] 
        } 
      }),
    });
  } catch (error) {
    throw new Error(`Network error when connecting to Apify: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    throw new Error(`Failed to start Apify scraper: ${startResponse.status} ${startResponse.statusText} - ${errText}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;
  const defaultDatasetId = runData.data.defaultDatasetId;

  // 2. Poll for completion
  let isFinished = false;
  const maxRetries = 45; // Approx 90 seconds max wait
  let attempts = 0;

  while (!isFinished && attempts < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    attempts++;

    const runStatusRes = await fetch(`${APIFY_API_URL}/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`);
    if (!runStatusRes.ok) continue;

    const runStatusData = await runStatusRes.json();
    const status = runStatusData.data.status;

    if (status === 'SUCCEEDED') {
      isFinished = true;
    } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify scrape failed with status: ${status}`);
    }
  }

  if (!isFinished) {
    throw new Error("Scraping timed out (took longer than 90s).");
  }

  // 3. Fetch the dataset results
  const datasetRes = await fetch(`${APIFY_API_URL}/datasets/${defaultDatasetId}/items?token=${APIFY_TOKEN}`);
  if (!datasetRes.ok) {
    throw new Error("Failed to fetch scraped dataset.");
  }

  const datasetItems = await datasetRes.json();

  if (!datasetItems || datasetItems.length === 0) {
    throw new Error("No data found. The account might be private, the handle is incorrect, or the scraper was blocked.");
  }

  // Return the entire array of posts (not just the first item) so Gemini can see trends
  return JSON.stringify(datasetItems, null, 2);
};