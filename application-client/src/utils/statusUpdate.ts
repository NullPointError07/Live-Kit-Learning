export async function updateLiveClassStatus(id: string, status: string) {
  try {
    await fetch(`${import.meta.env.VITE_EK_ACADEMY_LIVE_CLASS_STATUS_UPDATE}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id, status }),
    });
  } catch (error) {
    console.error("Error updating live class status:", error);
    throw new Error("Failed to update live class status");
  }
}
