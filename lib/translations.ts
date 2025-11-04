export const translations = {
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    
    // Homepage
    title: "ItzFesi Social Media Stats",
    subtitle: "Real-time follower counts across all platforms",
    
    // Stats
    youtube: "YouTube",
    telegram: "Telegram",
    instagram: "Instagram",
    subscribers: "Subscribers",
    members: "Members",
    followers: "Followers",
    views: "Views",
    videos: "Videos",
    
    // Notification Form
    notificationTitle: "Get Milestone Notifications",
    notificationDescription: "Be the first to know when ItzFesi hits a new milestone!",
    emailPlaceholder: "Enter your email",
    telegramDescription: "Or subscribe via Telegram for instant notifications",
    telegramButton: "Join Telegram Bot",
    subscribeButton: "Subscribe",
    subscribing: "Subscribing...",
    subscribeSuccess: "Successfully subscribed!",
    subscribeSuccessDescription: "You'll receive notifications for new milestones",
    subscribeError: "Subscription failed",
    
    // Admin
    adminLogin: "Admin Login",
    adminLoginDescription: "Enter your admin token to access the dashboard",
    tokenPlaceholder: "Enter admin token",
    loginButton: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful!",
    loginError: "Invalid token",
    logout: "Logout",
    backToDashboard: "← Back to Dashboard",
    
    // Admin Dashboard
    dashboardTitle: "Admin Dashboard",
    dashboardSubtitle: "Manage notifications and monitor stats",
    broadcastCard: "Broadcast Message",
    broadcastDescription: "Send a custom message to all Telegram subscribers",
    messagePlaceholder: "Enter your message...",
    sendButton: "Send Broadcast",
    sending: "Sending...",
    sendSuccess: "Message sent!",
    sendSuccessDescription: "Broadcast delivered to {count} subscribers",
    sendError: "Failed to send",
    
    subscribersCard: "Telegram Subscribers",
    subscribersDescription: "Total users subscribed to the bot",
    totalSubscribers: "Total Subscribers",
    
    milestonesCard: "Milestone Tracker",
    milestonesDescription: "View and manage automated milestone notifications",
    viewMilestones: "View Milestones",
    
    // Milestones Page
    milestoneTitle: "Milestone Tracker",
    milestoneSubtitle: "Automated milestone detection and notifications",
    howItWorksTitle: "How It Works",
    howItWorksDescription: "Automatic notifications for rounded subscriber milestones",
    
    trackedMilestones: "📊 Tracked Milestones:",
    milestone1K: "Every 1K from 1K to 10K",
    milestone5K: "Every 5K from 15K to 50K",
    milestoneMajor: "Major: 75K, 100K, 250K, 500K, 1M+",
    
    automatedChecking: "⚙️ Automated Checking Methods:",
    clientSide: "Client-Side",
    clientSideDesc: "Homepage checks every 2 hours when users visit",
    githubActions: "GitHub Actions",
    githubActionsDesc: "Automated workflow runs every 3 hours",
    vercelCron: "Vercel Cron",
    vercelCronDesc: "Scheduled check runs once daily (Hobby plan)",
    multipleMethodsNote: "Multiple methods ensure reliable milestone detection even with free tier limitations",
    
    notifications: "🔔 Notifications:",
    notificationsDesc: "When a milestone is reached, all Telegram subscribers receive an automatic celebration message.",
    
    manualCheckTitle: "Manual Check",
    manualCheckDescription: "Force check for milestones right now",
    checkButton: "Check Milestones Now",
    checking: "Checking...",
    
    checkResults: "Check Results",
    currentStats: "📊 Current Stats:",
    totalViews: "👁️ Total Views:",
    lastNotified: "Last notified:",
    never: "Never",
    milestonesDetected: "🎉 Milestones Detected:",
    milestone: "Milestone:",
    notified: "notified",
    platformsChecked: "Platforms Checked",
    notificationsSent: "Notifications Sent",
    
    checkScheduleTitle: "⏰ Check Schedule",
    checkScheduleDescription: "Multiple automated methods for reliability",
    clientSidePolling: "🌐 Client-Side Polling",
    clientSideStatus: "Active",
    clientSideDetails: "Checks every 2 hours when users visit homepage",
    clientSideFeatures: "✓ Works on all Vercel plans • No configuration needed",
    
    githubActionsTitle: "⚡ GitHub Actions",
    githubActionsFrequency: "Every 3 hours",
    githubActionsDetails: "Automated workflow using GitHub's free tier",
    githubActionsFeatures: "✓ Most reliable method • Runs 8 times per day",
    
    vercelCronTitle: "⏰ Vercel Cron",
    vercelCronFrequency: "Daily",
    vercelCronDetails: "Scheduled at midnight (00:00 UTC)",
    vercelCronFeatures: "✓ Backup method • Hobby plan limitation",
    
    proTip: "💡 Pro Tip: The system uses whichever method triggers first, ensuring milestones are caught quickly",
    
    // Toasts
    milestoneDetected: "Milestones detected!",
    notificationCount: "{count} notification(s) sent",
    noNewMilestones: "No new milestones",
    checkFailed: "Check failed",
    requestFailed: "Request failed",
  },
  
  fa: {
    // Common
    loading: "در حال بارگذاری...",
    error: "خطا",
    success: "موفق",
    
    // Homepage
    title: "آمار شبکه‌های اجتماعی ItzFesi",
    subtitle: "تعداد دنبال‌کنندگان در تمام پلتفرم‌ها به صورت زنده",
    
    // Stats
    youtube: "یوتیوب",
    telegram: "تلگرام",
    instagram: "اینستاگرام",
    subscribers: "مشترک",
    members: "عضو",
    followers: "دنبال‌کننده",
    views: "بازدید",
    videos: "ویدیو",
    
    // Notification Form
    notificationTitle: "دریافت اعلان‌های نقاط عطف",
    notificationDescription: "اولین نفری باشید که از رسیدن ItzFesi به نقاط عطف جدید باخبر می‌شوید!",
    emailPlaceholder: "ایمیل خود را وارد کنید",
    telegramDescription: "یا از طریق تلگرام برای دریافت اعلان‌های فوری مشترک شوید",
    telegramButton: "عضویت در ربات تلگرام",
    subscribeButton: "اشتراک",
    subscribing: "در حال اشتراک...",
    subscribeSuccess: "اشتراک موفق بود!",
    subscribeSuccessDescription: "شما اعلان‌های نقاط عطف جدید را دریافت خواهید کرد",
    subscribeError: "اشتراک ناموفق بود",
    
    // Admin
    adminLogin: "ورود مدیریت",
    adminLoginDescription: "توکن مدیریت خود را برای دسترسی به داشبورد وارد کنید",
    tokenPlaceholder: "توکن مدیریت را وارد کنید",
    loginButton: "ورود",
    loggingIn: "در حال ورود...",
    loginSuccess: "ورود موفق!",
    loginError: "توکن نامعتبر",
    logout: "خروج",
    backToDashboard: "← بازگشت به داشبورد",
    
    // Admin Dashboard
    dashboardTitle: "داشبورد مدیریت",
    dashboardSubtitle: "مدیریت اعلان‌ها و نظارت بر آمار",
    broadcastCard: "ارسال پیام همگانی",
    broadcastDescription: "ارسال پیام سفارشی به تمام مشترکین تلگرام",
    messagePlaceholder: "پیام خود را وارد کنید...",
    sendButton: "ارسال پیام",
    sending: "در حال ارسال...",
    sendSuccess: "پیام ارسال شد!",
    sendSuccessDescription: "پیام به {count} مشترک ارسال شد",
    sendError: "ارسال ناموفق",
    
    subscribersCard: "مشترکین تلگرام",
    subscribersDescription: "تعداد کل کاربران مشترک ربات",
    totalSubscribers: "کل مشترکین",
    
    milestonesCard: "ردیاب نقاط عطف",
    milestonesDescription: "مشاهده و مدیریت اعلان‌های خودکار نقاط عطف",
    viewMilestones: "مشاهده نقاط عطف",
    
    // Milestones Page
    milestoneTitle: "ردیاب نقاط عطف",
    milestoneSubtitle: "تشخیص خودکار نقاط عطف و اعلان‌ها",
    howItWorksTitle: "نحوه عملکرد",
    howItWorksDescription: "اعلان‌های خودکار برای نقاط عطف گرد شده مشترکین",
    
    trackedMilestones: "📊 نقاط عطف ردیابی شده:",
    milestone1K: "هر 1K از 1K تا 10K",
    milestone5K: "هر 5K از 15K تا 50K",
    milestoneMajor: "مهم: 75K، 100K، 250K، 500K، 1M+",
    
    automatedChecking: "⚙️ روش‌های بررسی خودکار:",
    clientSide: "سمت کلاینت",
    clientSideDesc: "صفحه اصلی هر 2 ساعت بررسی می‌کند",
    githubActions: "GitHub Actions",
    githubActionsDesc: "گردش کار خودکار هر 3 ساعت اجرا می‌شود",
    vercelCron: "Vercel Cron",
    vercelCronDesc: "بررسی برنامه‌ریزی شده روزانه (پلن Hobby)",
    multipleMethodsNote: "روش‌های متعدد تشخیص قابل اعتماد نقاط عطف را حتی با محدودیت‌های سطح رایگان تضمین می‌کنند",
    
    notifications: "🔔 اعلان‌ها:",
    notificationsDesc: "وقتی به یک نقطه عطف می‌رسید، تمام مشترکین تلگرام یک پیام جشن خودکار دریافت می‌کنند.",
    
    manualCheckTitle: "بررسی دستی",
    manualCheckDescription: "بررسی اجباری نقاط عطف در همین لحظه",
    checkButton: "بررسی نقاط عطف",
    checking: "در حال بررسی...",
    
    checkResults: "نتایج بررسی",
    currentStats: "📊 آمار فعلی:",
    totalViews: "👁️ کل بازدیدها:",
    lastNotified: "آخرین اعلان:",
    never: "هرگز",
    milestonesDetected: "🎉 نقاط عطف شناسایی شده:",
    milestone: "نقطه عطف:",
    notified: "مطلع شده",
    platformsChecked: "پلتفرم‌های بررسی شده",
    notificationsSent: "اعلان‌های ارسال شده",
    
    checkScheduleTitle: "⏰ برنامه بررسی",
    checkScheduleDescription: "روش‌های خودکار متعدد برای قابلیت اطمینان",
    clientSidePolling: "🌐 نظرسنجی سمت کلاینت",
    clientSideStatus: "فعال",
    clientSideDetails: "هر 2 ساعت هنگام بازدید کاربران از صفحه اصلی بررسی می‌کند",
    clientSideFeatures: "✓ در تمام پلن‌های Vercel کار می‌کند • نیازی به پیکربندی ندارد",
    
    githubActionsTitle: "⚡ GitHub Actions",
    githubActionsFrequency: "هر 3 ساعت",
    githubActionsDetails: "گردش کار خودکار با استفاده از سطح رایگان GitHub",
    githubActionsFeatures: "✓ قابل اعتمادترین روش • 8 بار در روز اجرا می‌شود",
    
    vercelCronTitle: "⏰ Vercel Cron",
    vercelCronFrequency: "روزانه",
    vercelCronDetails: "برنامه‌ریزی شده در نیمه‌شب (00:00 UTC)",
    vercelCronFeatures: "✓ روش پشتیبان • محدودیت پلن Hobby",
    
    proTip: "💡 نکته: سیستم از هر روشی که اول فعال شود استفاده می‌کند و اطمینان حاصل می‌کند که نقاط عطف سریع شناسایی می‌شوند",
    
    // Toasts
    milestoneDetected: "نقاط عطف شناسایی شد!",
    notificationCount: "{count} اعلان ارسال شد",
    noNewMilestones: "نقطه عطف جدیدی نیست",
    checkFailed: "بررسی ناموفق بود",
    requestFailed: "درخواست ناموفق بود",
  }
};

export type Language = 'en' | 'fa';
export type TranslationKey = keyof typeof translations.en;
