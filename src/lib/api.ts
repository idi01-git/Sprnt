const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Check if response is OK
  if (!response.ok) {
    // Try to parse error response as JSON, fallback to text
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        data: null,
        error: {
          code: 'API_ERROR',
          message: errorData?.error?.message || `HTTP error ${response.status}`,
          details: errorData?.error?.details,
        },
      };
    }
    return {
      success: false,
      data: null,
      error: {
        code: 'API_ERROR',
        message: `HTTP error ${response.status}: ${response.statusText}`,
      },
    };
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    // Not JSON - might be an error page (HTML)
    const text = await response.text().catch(() => 'Unknown error');
    console.error(`Non-JSON response from ${endpoint}:`, text.substring(0, 200));
    return {
      success: false,
      data: null,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Server returned an invalid response',
      },
    };
  }

  try {
    return await response.json();
  } catch (e) {
    console.error(`Failed to parse JSON from ${endpoint}:`, e);
    return {
      success: false,
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse server response',
      },
    };
  }
}

export interface Course {
  id: number;
  courseId: string;
  courseName: string;
  slug: string;
  affiliatedBranch: string;
  coursePrice: number;
  courseThumbnail: string | null;
  courseDescription: string;
  tags: string[];
  createdAt: string;
  _count?: {
    modules: number;
  };
}

export interface Branch {
  branch: string;
  courseCount: number;
}

export interface CoursesResponse {
  courses: Course[];
}

export interface BranchesResponse {
  branches: Branch[];
}

export async function getCourses(params?: {
  page?: number;
  limit?: number;
  branch?: string;
  search?: string;
  sort?: string;
}): Promise<ApiResponse<CoursesResponse>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.branch) searchParams.set('branch', params.branch);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  return fetchApi<CoursesResponse>(`/api/courses${query ? `?${query}` : ''}`);
}

export async function getBranches(): Promise<ApiResponse<BranchesResponse>> {
  return fetchApi<BranchesResponse>('/api/courses/branches');
}

export async function getCourseBySlug(slug: string): Promise<ApiResponse<{ course: Course }>> {
  return fetchApi<{ course: Course }>(`/api/courses/${slug}`);
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
  courseThumbnail: string | null;
  affiliatedBranch: string;
  currentDay: number;
  day7Completed: boolean;
  certificateIssued: boolean;
  daysCompleted: number;
  totalDays: number;
  enrolledAt: string;
  completedAt: string | null;
  status: 'in_progress' | 'completed';
}

export interface EnrollmentsResponse {
  enrollments: Enrollment[];
}

export interface EnrollmentsParams {
  page?: number;
  limit?: number;
  status?: 'in_progress' | 'completed';
}

export async function getEnrollments(params?: EnrollmentsParams): Promise<ApiResponse<EnrollmentsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return fetchApi<EnrollmentsResponse>(`/api/enrollments${query ? `?${query}` : ''}`);
}

export interface DayContent {
  id: string;
  enrollmentId: string;
  dayNumber: number;
  title: string;
  description: string;
  videoUrl: string | null;
  videoProvider: string | null;
  videoId: string | null;
  content: string;
  resources: { title: string; url: string }[];
  isUnlocked: boolean;
  isCompleted: boolean;
  quizPassed: boolean;
  quizScore: number | null;
  completedAt: string | null;
}

export interface DayContentResponse {
  day: DayContent;
}

export async function getDayContent(enrollmentId: string, dayNumber: number): Promise<ApiResponse<DayContentResponse>> {
  return fetchApi<DayContentResponse>(`/api/learn/${enrollmentId}/day/${dayNumber}`);
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  dayNumber: number;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number | null;
}

export interface QuizResponse {
  quiz: Quiz;
}

export async function getQuiz(moduleId: string): Promise<ApiResponse<QuizResponse>> {
  return fetchApi<QuizResponse>(`/api/quiz/${moduleId}`);
}

export interface QuizSubmission {
  answers: number[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  results: { questionId: string; correct: boolean; correctOption: number; selectedOption: number }[];
}

export interface QuizResultResponse {
  result: QuizResult;
}

export async function submitQuiz(moduleId: string, submission: QuizSubmission): Promise<ApiResponse<QuizResultResponse>> {
  return fetchApi<QuizResultResponse>(`/api/quiz/${moduleId}`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export interface WalletBalance {
  totalBalance: number;
  availableBalance: number;
  lockedAmount: number;
  upiId: string | null;
  hasPendingWithdrawal: boolean;
  pendingWithdrawal: {
    id: string;
    amount: number;
    requestedAt: Date;
  } | null;
}

export interface WalletBalanceResponse {
  wallet: WalletBalance;
}

export async function getWalletBalance(): Promise<ApiResponse<WalletBalanceResponse>> {
  return fetchApi<WalletBalanceResponse>('/api/wallet/balance');
}

export interface Transaction {
  id: string;
  type: 'referral_bonus' | 'withdrawal' | 'earning';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export async function getTransactions(page?: number, limit?: number): Promise<ApiResponse<TransactionsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (page) searchParams.set('page', String(page));
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return fetchApi<TransactionsResponse>(`/api/wallet/transactions${query ? `?${query}` : ''}`);
}

export interface WithdrawalRequest {
  amount: number;
  upiId: string;
}

export interface WithdrawalResponse {
  withdrawal: { id: string; status: string };
}

export async function requestWithdrawal(request: WithdrawalRequest): Promise<ApiResponse<WithdrawalResponse>> {
  return fetchApi<WithdrawalResponse>('/api/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface ReferralStats {
  totalReferred: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  walletBalance: number;
}

export interface ReferralStatsResponse {
  stats: ReferralStats;
}

export async function getReferralStats(): Promise<ApiResponse<ReferralStatsResponse>> {
  return fetchApi<ReferralStatsResponse>('/api/referrals/stats');
}

export interface Referral {
  id: string;
  referredUserEmail: string;
  referredUserName: string | null;
  status: 'pending' | 'completed' | 'expired';
  bonusAmount: number;
  enrolledCourseName: string | null;
  createdAt: string;
  convertedAt: string | null;
}

export interface ReferralsResponse {
  referrals: Referral[];
}

export async function getReferrals(page?: number, limit?: number): Promise<ApiResponse<ReferralsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (page) searchParams.set('page', String(page));
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return fetchApi<ReferralsResponse>(`/api/referrals${query ? `?${query}` : ''}`);
}

export interface ReferralCodeResponse {
  code: string;
}

export async function getReferralCode(): Promise<ApiResponse<ReferralCodeResponse>> {
  return fetchApi<ReferralCodeResponse>('/api/referrals/code');
}

export interface Certificate {
  id: string;
  certificateId: string;
  enrollmentId: string;
  courseName: string;
  studentName: string;
  issueDate: string;
  downloadUrl: string;
  verifyUrl: string;
}

export interface CertificateResponse {
  certificate: Certificate;
}

export async function getCertificate(enrollmentId: string): Promise<ApiResponse<CertificateResponse>> {
  return fetchApi<CertificateResponse>(`/api/certificates/${enrollmentId}`);
}

export interface CertificateVerifyResponse {
  valid: boolean;
  certificate: Certificate | null;
  message: string;
}

export async function verifyCertificate(certificateId: string): Promise<ApiResponse<CertificateVerifyResponse>> {
  return fetchApi<CertificateVerifyResponse>(`/api/certificates/verify/${certificateId}`);
}

export interface Notification {
  id: string;
  type: 'enrollment' | 'quiz_passed' | 'certificate_issued' | 'referral_bonus' | 'withdrawal' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function getNotifications(page?: number, limit?: number): Promise<ApiResponse<NotificationsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (page) searchParams.set('page', String(page));
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return fetchApi<NotificationsResponse>(`/api/notifications${query ? `?${query}` : ''}`);
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function getUnreadNotificationCount(): Promise<ApiResponse<UnreadCountResponse>> {
  return fetchApi<UnreadCountResponse>('/api/notifications/unread-count');
}

export async function markNotificationRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsRead(): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  });
}

export interface Submission {
  id: string;
  enrollmentId: string;
  courseName: string;
  courseSlug: string;
  reviewStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';
  gradeCategory: string | null;
  finalGrade: number | null;
  resubmissionCount: number;
  maxResubmissions: number;
  submittedAt: string;
  reviewCompletedAt: string | null;
}

export interface SubmissionsResponse {
  submissions: Submission[];
}

export async function getSubmissions(page?: number, limit?: number): Promise<ApiResponse<SubmissionsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (page) searchParams.set('page', String(page));
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return fetchApi<SubmissionsResponse>(`/api/submissions${query ? `?${query}` : ''}`);
}

export interface CreateSubmissionRequest {
  enrollmentId: string;
  projectFileUrl: string;
  reportPdfUrl: string;
}

export interface CreateSubmissionResponse {
  submission: Submission;
}

export async function createSubmission(request: CreateSubmissionRequest): Promise<ApiResponse<CreateSubmissionResponse>> {
  return fetchApi<CreateSubmissionResponse>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============ ADMIN APIs ============

// Admin Dashboard
export interface AdminKPIs {
  totalUsers: number;
  totalEnrollments: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueAllTime: number;
}

export interface AdminActionItems {
  pendingSubmissions: number;
  pendingWithdrawals: number;
  pendingIdentityVerifications: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  refunds?: number;
  netRevenue?: number;
}

export interface SignupData {
  date: string;
  newUsers: number;
  activeUsers?: number;
}

export interface RecentEnrollment {
  id: string;
  userName: string;
  courseName: string;
  amount: number;
  createdAt: string;
}

export interface RecentSubmission {
  id: string;
  userName: string;
  courseName: string;
  status: string;
  createdAt: string;
}

export async function getAdminKPIs(): Promise<ApiResponse<{ kpis: AdminKPIs }>> {
  return fetchApi<{ kpis: AdminKPIs }>('/api/admin/dashboard/kpis');
}

export async function getAdminActionItems(): Promise<ApiResponse<{ actionItems: AdminActionItems }>> {
  return fetchApi<{ actionItems: AdminActionItems }>('/api/admin/dashboard/action-items');
}

export async function getAdminRevenueChart(days?: number): Promise<ApiResponse<{ chart: RevenueData[] }>> {
  const query = days ? `?days=${days}` : '';
  return fetchApi<{ chart: RevenueData[] }>(`/api/admin/dashboard/charts/revenue${query}`);
}

export async function getAdminSignupsChart(days?: number): Promise<ApiResponse<{ chart: SignupData[] }>> {
  const query = days ? `?days=${days}` : '';
  return fetchApi<{ chart: SignupData[] }>(`/api/admin/dashboard/charts/signups${query}`);
}

export async function getAdminRecentEnrollments(): Promise<ApiResponse<{ enrollments: RecentEnrollment[] }>> {
  return fetchApi<{ enrollments: RecentEnrollment[] }>('/api/admin/dashboard/recent-enrollments');
}

export async function getAdminRecentSubmissions(): Promise<ApiResponse<{ submissions: RecentSubmission[] }>> {
  return fetchApi<{ submissions: RecentSubmission[] }>('/api/admin/dashboard/recent-submissions');
}

// Admin Users
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  studyLevel: string | null;
  createdAt: string;
  status: 'active' | 'suspended';
  emailVerified: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export async function getAdminUsers(params?: {
  search?: string;
  status?: 'active' | 'suspended';
  studyLevel?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminUsersResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.studyLevel) searchParams.set('studyLevel', params.studyLevel);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminUsersResponse>(`/api/admin/users${query ? `?${query}` : ''}`);
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  studyLevel: string | null;
  createdAt: string;
  status: string;
  emailVerified: boolean;
}

export async function getAdminUserDetail(userId: string): Promise<ApiResponse<{ user: AdminUserDetail }>> {
  return fetchApi<{ user: AdminUserDetail }>(`/api/admin/users/${userId}`);
}

export async function suspendAdminUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/users/${userId}/suspend`, { method: 'PATCH' });
}

export async function activateAdminUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/users/${userId}/activate`, { method: 'PATCH' });
}

// Admin Courses
export interface AdminCourse {
  id: string;
  courseId: string;
  courseName: string;
  slug: string;
  branch: string;
  price: number;
  isActive: boolean;
  tags: string[];
  modulesCount: number;
  enrollmentsCount: number;
  createdAt: string;
}

export interface AdminCoursesResponse {
  courses: AdminCourse[];
}

export async function getAdminCourses(params?: {
  search?: string;
  branch?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminCoursesResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.branch) searchParams.set('branch', params.branch);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminCoursesResponse>(`/api/admin/courses${query ? `?${query}` : ''}`);
}

export async function createAdminCourse(data: Partial<AdminCourse>): Promise<ApiResponse<{ course: AdminCourse }>> {
  return fetchApi<{ course: AdminCourse }>('/api/admin/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminCourse(courseId: string, data: Partial<AdminCourse>): Promise<ApiResponse<{ course: AdminCourse }>> {
  return fetchApi<{ course: AdminCourse }>(`/api/admin/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleAdminCourseStatus(courseId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/courses/${courseId}/status`, { method: 'PATCH' });
}

// Admin Submissions
export interface AdminSubmission {
  id: string;
  enrollmentId: string;
  userName: string;
  userEmail: string;
  courseName: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';
  submittedAt: string;
  grade: string | null;
}

export interface AdminSubmissionsResponse {
  submissions: AdminSubmission[];
}

export interface SubmissionStats {
  pending: number;
  underReview: number;
  approvedToday: number;
  rejectedToday: number;
}

export async function getAdminSubmissions(params?: {
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  search?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminSubmissionsResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.courseId) searchParams.set('courseId', params.courseId);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminSubmissionsResponse>(`/api/admin/submissions${query ? `?${query}` : ''}`);
}

export async function getAdminSubmissionStats(): Promise<ApiResponse<{ stats: SubmissionStats }>> {
  return fetchApi<{ stats: SubmissionStats }>('/api/admin/submissions/stats');
}

export async function getAdminSubmissionDetail(submissionId: string): Promise<ApiResponse<{ submission: any }>> {
  return fetchApi<{ submission: any }>(`/api/admin/submissions/${submissionId}`);
}

export async function approveSubmission(submissionId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/submissions/${submissionId}/approve`, { method: 'POST' });
}

export async function rejectSubmission(submissionId: string, notes: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/submissions/${submissionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes: notes }),
  });
}

// Admin Certificates
export interface AdminCertificate {
  id: string;
  certificateId: string;
  userName: string;
  courseName: string;
  grade: string;
  status: 'valid' | 'revoked';
  issuedAt: string;
}

export interface AdminCertificatesResponse {
  certificates: AdminCertificate[];
}

export async function getAdminCertificates(params?: {
  search?: string;
  status?: 'valid' | 'revoked';
  courseId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminCertificatesResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.courseId) searchParams.set('courseId', params.courseId);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminCertificatesResponse>(`/api/admin/certificates${query ? `?${query}` : ''}`);
}

export interface CertificateStats {
  totalIssued: number;
  validCount: number;
  revokedCount: number;
  distinctionCount: number;
  firstClassCount: number;
  passCount: number;
}

export async function getAdminCertificateStats(): Promise<ApiResponse<{ stats: CertificateStats }>> {
  return fetchApi<{ stats: CertificateStats }>('/api/admin/certificates/stats');
}

export async function revokeCertificate(certificateId: string, reason: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/certificates/${certificateId}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Admin Referrals
export interface AdminReferral {
  id: string;
  referrerName: string;
  referrerEmail: string;
  refereeName: string;
  refereeEmail: string;
  status: 'pending' | 'completed' | 'expired';
  bonusAmount: number;
  createdAt: string;
  convertedAt: string | null;
}

export interface AdminReferralsResponse {
  referrals: AdminReferral[];
}

export async function getAdminReferrals(params?: {
  status?: 'pending' | 'completed';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminReferralsResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminReferralsResponse>(`/api/admin/referrals${query ? `?${query}` : ''}`);
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  conversionRate: number;
  totalPayouts: number;
}

export async function getAdminReferralStats(): Promise<ApiResponse<{ stats: ReferralStats }>> {
  return fetchApi<{ stats: ReferralStats }>('/api/admin/referrals/stats');
}

// Admin Withdrawals
export interface AdminWithdrawal {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  upiId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  processedAt: string | null;
}

export interface AdminWithdrawalsResponse {
  withdrawals: AdminWithdrawal[];
}

export async function getAdminWithdrawals(params?: {
  status?: 'pending' | 'processing' | 'completed' | 'rejected';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminWithdrawalsResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminWithdrawalsResponse>(`/api/admin/withdrawals${query ? `?${query}` : ''}`);
}

export interface WithdrawalStats {
  pendingCount: number;
  pendingAmount: number;
  processedToday: number;
  processedAmountToday: number;
  totalProcessed: number;
}

export async function getAdminWithdrawalStats(): Promise<ApiResponse<{ stats: WithdrawalStats }>> {
  return fetchApi<{ stats: WithdrawalStats }>('/api/admin/withdrawals/stats');
}

export async function processWithdrawal(withdrawalId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/withdrawals/${withdrawalId}/process`, { method: 'PATCH' });
}

export async function completeWithdrawal(withdrawalId: string, transactionId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/withdrawals/${withdrawalId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ transactionId, confirmCheckbox: true }),
  });
}

export async function rejectWithdrawal(withdrawalId: string, reason: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Admin Promocodes
export interface AdminPromocode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface AdminPromocodesResponse {
  promocodes: AdminPromocode[];
}

export async function getAdminPromocodes(params?: {
  search?: string;
  status?: 'active' | 'inactive' | 'expired';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminPromocodesResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchApi<AdminPromocodesResponse>(`/api/admin/promocodes${query ? `?${query}` : ''}`);
}

export async function createAdminPromocode(data: Partial<AdminPromocode>): Promise<ApiResponse<{ promocode: AdminPromocode }>> {
  return fetchApi<{ promocode: AdminPromocode }>('/api/admin/promocodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminPromocode(promocodeId: string, data: Partial<AdminPromocode>): Promise<ApiResponse<{ promocode: AdminPromocode }>> {
  return fetchApi<{ promocode: AdminPromocode }>(`/api/admin/promocodes/${promocodeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function togglePromocodeStatus(promocodeId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/promocodes/${promocodeId}/status`, { method: 'PATCH' });
}
