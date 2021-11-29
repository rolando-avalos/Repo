let color = '#FF0000';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log(`color: ${color}`);
});
