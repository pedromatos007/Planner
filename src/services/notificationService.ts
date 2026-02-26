export const sendNotification = async (title: string, message: string, type: 'task' | 'mood' | 'finance' | 'habit' | 'system') => {
  try {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-email': email
      },
      body: JSON.stringify({ title, message, type })
    });
    
    // Notify sidebar to update unread count
    window.dispatchEvent(new Event('notification-update'));
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
