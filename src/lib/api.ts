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
  id: string;
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

export async function getAdminBranches(): Promise<ApiResponse<BranchesResponse>> {
  return fetchApi<BranchesResponse>('/api/admin/courses/branches');
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
  certificateId: string | null;
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
  dayNumber: number;
  title: string;
  description: string;
  moduleId: string;
  notesPdfUrl: string | null;
  youtubeUrl: string | null;
  videoUrl: string | null;
  content: string;
  resources: { title: string; url: string }[];
  quiz: {
    attempted: boolean;
    passed: boolean;
    attempts: number;
    cooldownUntil: string | null;
    cooldownActive: boolean;
  };
  isLocked: boolean;
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
    requestedAt: string;
  } | null;
}

export interface WalletBalanceResponse {
  wallet: WalletBalance;
}

export async function getWalletBalance(): Promise<ApiResponse<WalletBalanceResponse>> {
  return fetchApi<WalletBalanceResponse>('/api/wallet/balance');
}

export interface UserWithdrawal {
  id: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectionReason: string | null;
  transactionId: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface UserWithdrawalsResponse {
  withdrawals: UserWithdrawal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getUserWithdrawals(): Promise<ApiResponse<UserWithdrawalsResponse>> {
  return fetchApi<UserWithdrawalsResponse>('/api/wallet/withdrawals');
}

export interface Transaction {
  id: string;
  type: 'course_purchase' | 'referral_credit' | 'withdrawal' | 'refund' | 'manual_credit' | 'manual_debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
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
  status: 'pending' | 'completed' | 'rejected';
  bonusAmount: number;
  enrolledCourseName: string | null;
  createdAt: string;
  convertedAt: string | null;
  autoApproveAt: string | null;
}

export interface ReferralsResponse {
  referrals: Referral[];
}

export async function getReferrals(page?: number, limit?: number): Promise<ApiResponse<ReferralsResponse>> {
  const searchParams = new URLSearchParams();
  
  if (page) searchParams.set('page', String(page));
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return fetchApi<ReferralsResponse>(`/api/referrals/list${query ? `?${query}` : ''}`);
}

export interface ReferralCodeResponse {
  code: string | null;
  isActive: boolean;
  shareUrl: string | null;
}

export async function getReferralCode(): Promise<ApiResponse<ReferralCodeResponse>> {
  return fetchApi<ReferralCodeResponse>('/api/referrals/code');
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
  adminNotes: string | null;
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
  paidEnrollments: number;
  totalCourses: number;
  revenueToday: number;
  revenueMonth: number;
  newUsersToday: number;
  newUsersMonth: number;
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
  status: 'active' | 'suspended';
  emailVerified: boolean;
  walletBalance: number;
  enrollmentsCount: number;
  submissionsCount: number;
  createdAt: string;
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
  deletedAt: string | null;
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
  // Map form field names to API/schema field names
  const apiData: Record<string, unknown> = { ...data };
  if ('branch' in apiData) {
    apiData.affiliatedBranch = apiData.branch;
    delete apiData.branch;
  }
  if ('price' in apiData) {
    apiData.coursePrice = apiData.price;
    delete apiData.price;
  }
  return fetchApi<{ course: AdminCourse }>(`/api/admin/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(apiData),
  });
}

export async function toggleAdminCourseStatus(courseId: string, isActive: boolean): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/courses/${courseId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteAdminCourse(courseId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
}

export async function restoreAdminCourse(courseId: string): Promise<ApiResponse<{ course: AdminCourse; message: string }>> {
  return fetchApi<{ course: AdminCourse; message: string }>(`/api/admin/courses/${courseId}?action=restore`, { method: 'PATCH' });
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

export async function processWithdrawal(withdrawalId: string): Promise<ApiResponse<{ success: boolean; upiId?: string | null }>> {
  return fetchApi<{ success: boolean; upiId?: string | null }>(`/api/admin/withdrawals/${withdrawalId}/process`, { method: 'PATCH' });
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

// Admin Certificates
export interface AdminCertificate {
  id: string;
  certificateId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseId: string;
  branch: string | null;
  issueDate: string;
  enrolledAt: string;
}

export interface AdminCertificatesResponse {
  certificates: AdminCertificate[];
}

export async function getAdminCertificates(): Promise<ApiResponse<AdminCertificatesResponse>> {
  return fetchApi<AdminCertificatesResponse>('/api/admin/certificates');
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

// User Profile & Settings
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: string | null; // ISO date string when verified, null if not
  avatarUrl: string | null;
  dob: string | null;
  studyLevel: string | null;
  referralCode: string | null;
  upiId?: string | null;
}

export async function getUserProfile(): Promise<ApiResponse<{ profile: UserProfile }>> {
  return fetchApi<{ profile: UserProfile }>('/api/users/profile');
}

export async function updateUserProfile(data: {
  name?: string;
  phone?: string;
  dob?: string;
  studyLevel?: string;
}): Promise<ApiResponse<{ profile: UserProfile }>> {
  return fetchApi<{ profile: UserProfile }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateUpi(upiId: string): Promise<ApiResponse<{ success: boolean; upiId: string }>> {
  return fetchApi<{ success: boolean; upiId: string }>('/api/users/profile/upi', {
    method: 'PUT',
    body: JSON.stringify({ upiId }),
  });
}

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export async function getUserSessions(): Promise<ApiResponse<{ sessions: UserSession[] }>> {
  return fetchApi<{ sessions: UserSession[] }>('/api/users/sessions');
}

export async function revokeSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/users/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

// ─── Admin User Sub-resources ──────────────────────────────────────────────

export async function getAdminUserEnrollments(userId: string): Promise<ApiResponse<{ enrollments: any[] }>> {
  return fetchApi<{ enrollments: any[] }>(`/api/admin/users/${userId}/enrollments`);
}

export async function getAdminUserSubmissions(userId: string): Promise<ApiResponse<{ submissions: any[] }>> {
  return fetchApi<{ submissions: any[] }>(`/api/admin/users/${userId}/submissions`);
}

export async function getAdminUserReferrals(userId: string): Promise<ApiResponse<{ referrals: any[] }>> {
  return fetchApi<{ referrals: any[] }>(`/api/admin/users/${userId}/referrals`);
}

export async function getAdminUserTransactions(userId: string): Promise<ApiResponse<{ transactions: any[] }>> {
  return fetchApi<{ transactions: any[] }>(`/api/admin/users/${userId}/transactions`);
}

export async function adminManualEnroll(userId: string, courseId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/users/${userId}/manual-enroll`, {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });
}

export async function adminResetUserPassword(userId: string): Promise<ApiResponse<{ success: boolean; temporaryPassword?: string }>> {
  return fetchApi<{ success: boolean; temporaryPassword?: string }>(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
  });
}

export async function adminRevokeUserSessions(userId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/users/${userId}/revoke-sessions`, {
    method: 'DELETE',
  });
}

// ─── Admin Course Detail & Modules ────────────────────────────────────────

export interface AdminCourseDetail extends AdminCourse {
  courseDescription: string;
  courseThumbnail: string;
  problemStatementText: string;
  modules: AdminModule[];
}

export async function getAdminCourseDetail(courseId: string): Promise<ApiResponse<{ course: AdminCourseDetail }>> {
  return fetchApi<{ course: AdminCourseDetail }>(`/api/admin/courses/${courseId}`);
}

export async function getAdminCourseStats(courseId: string): Promise<ApiResponse<{ stats: any }>> {
  return fetchApi<{ stats: any }>(`/api/admin/courses/${courseId}/stats`);
}

export async function getAdminCourseEnrollments(courseId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ enrollments: any[] }>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return fetchApi<{ enrollments: any[] }>(`/api/admin/courses/${courseId}/enrollments${q.toString() ? `?${q}` : ''}`);
}

export async function getAdminCourseModules(courseId: string): Promise<ApiResponse<{ modules: AdminModule[] }>> {
  return fetchApi<{ modules: AdminModule[] }>(`/api/admin/courses/${courseId}/modules`);
}

export async function createAdminModule(courseId: string, data: Partial<AdminModule>): Promise<ApiResponse<{ module: AdminModule }>> {
  return fetchApi<{ module: AdminModule }>(`/api/admin/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminModule(courseId: string, moduleId: string, data: Partial<AdminModule>): Promise<ApiResponse<{ module: AdminModule }>> {
  return fetchApi<{ module: AdminModule }>(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminModule(courseId: string, moduleId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
}

export interface AdminModule {
  id: string;
  courseId: string;
  dayNumber: number;
  title: string;
  contentText: string;
  youtubeUrl: string | null;
  notesPdfUrl: string | null;
  isFreePreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminModuleDetail(courseId: string, moduleId: string): Promise<ApiResponse<AdminModule>> {
  return fetchApi<AdminModule>(`/api/admin/courses/${courseId}/modules/${moduleId}`);
}

export interface AdminQuizQuestion {
  id?: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface QuizQuestionFromApi {
  id?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export async function getAdminModuleQuiz(courseId: string, moduleId: string): Promise<ApiResponse<QuizQuestionFromApi[]>> {
  return fetchApi<QuizQuestionFromApi[]>(`/api/admin/courses/${courseId}/modules/${moduleId}/quiz`);
}

export async function replaceAdminModuleQuiz(courseId: string, moduleId: string, questions: AdminQuizQuestion[]): Promise<ApiResponse<QuizQuestionFromApi[]>> {
  return fetchApi<QuizQuestionFromApi[]>(`/api/admin/courses/${courseId}/modules/${moduleId}/quiz`, {
    method: 'PUT',
    body: JSON.stringify({ questions }),
  });
}

export async function duplicateAdminCourse(courseId: string): Promise<ApiResponse<{ course: AdminCourse }>> {
  return fetchApi<{ course: AdminCourse }>(`/api/admin/courses/${courseId}/duplicate`, { method: 'POST' });
}

// ─── Admin Promocodes ───────────────────────────────────────────────────────

export async function deleteAdminPromocode(promocodeId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/promocodes/${promocodeId}`, { method: 'DELETE' });
}

export async function getAdminPromocodeUsage(promocodeId: string): Promise<ApiResponse<{ usage: any[] }>> {
  return fetchApi<{ usage: any[] }>(`/api/admin/promocodes/${promocodeId}/usage`);
}

// ─── Admin Accounts (Super Admin) ─────────────────────────────────────────

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'reviewer' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  lastActivity: string | null;
}

export async function getAdminAccounts(): Promise<ApiResponse<{ admins: AdminAccount[] }>> {
  return fetchApi<{ admins: AdminAccount[] }>('/api/admin/admins');
}

export async function createAdminAccount(data: { name: string; email: string; role: string; password: string }): Promise<ApiResponse<{ admin: AdminAccount }>> {
  return fetchApi<{ admin: AdminAccount }>('/api/admin/admins', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminAccount(adminId: string, data: Partial<AdminAccount>): Promise<ApiResponse<{ admin: AdminAccount }>> {
  return fetchApi<{ admin: AdminAccount }>(`/api/admin/admins/${adminId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivateAdminAccount(adminId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/admins/${adminId}/deactivate`, { method: 'PATCH' });
}

export async function activateAdminAccount(adminId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/admins/${adminId}/activate`, { method: 'PATCH' });
}

export async function resetAdminAccountPassword(adminId: string): Promise<ApiResponse<{ success: boolean; temporaryPassword?: string }>> {
  return fetchApi<{ success: boolean; temporaryPassword?: string }>(`/api/admin/admins/${adminId}/reset-password`, { method: 'POST' });
}

export async function deleteAdminAccount(adminId: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/admin/admins/${adminId}`, { method: 'DELETE' });
}



