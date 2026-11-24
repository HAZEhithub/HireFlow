declare const chrome: {
  tabs: {
    query: (query: { active: boolean; currentWindow: boolean }) => Promise<Array<{ title?: string; url?: string }>>;
  };
};

const APP_ORIGIN = "http://localhost:3000";

function setStatus(message: string) {
  const status = document.getElementById("status");
  if (status) status.textContent = message;
}

async function readActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  const title = (tab?.title ?? "").slice(0, 200);
  const url = tab?.url ?? "";
  const titleInput = document.getElementById("title") as HTMLInputElement | null;
  const urlInput = document.getElementById("url") as HTMLTextAreaElement | null;
  const importLink = document.getElementById("import") as HTMLAnchorElement | null;
  if (titleInput) titleInput.value = title;
  if (urlInput) urlInput.value = url;
  if (importLink) {
    const params = new URLSearchParams({ applyUrl: url, title, companyName: title });
    importLink.href = `${APP_ORIGIN}/jobs/import?${params.toString()}`;
  }
  if (!url.startsWith("http")) {
    setStatus("Open a public http(s) job page first. Internal browser pages cannot be imported.");
  }
}

document.getElementById("copy")?.addEventListener("click", async () => {
  const title = (document.getElementById("title") as HTMLInputElement | null)?.value ?? "";
  const url = (document.getElementById("url") as HTMLTextAreaElement | null)?.value ?? "";
  await navigator.clipboard.writeText(`${title}\n${url}`);
  setStatus("Copied. Paste into HireFlow import if the app link does not open.");
});

void readActiveTab();
