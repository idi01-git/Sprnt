import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hash } from 'argon2'
import { AdminRole, StudyLevel } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
    // Safety check: Prevent running in production (unless explicitly allowed via env)
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Seeding is disabled in production' },
            { status: 403 }
        )
    }

    try {
        const hashedPassword = await hash('Password123!')

        // 1. Clean Database (Delete in reverse order of dependencies)
        await prisma.$transaction([
            prisma.dailyProgress.deleteMany(),
            prisma.submission.deleteMany(),
            prisma.transaction.deleteMany(),
            prisma.withdrawalRequest.deleteMany(),
            prisma.referral.deleteMany(),
            prisma.promocodeUsage.deleteMany(),
            prisma.enrollment.deleteMany(),
            prisma.courseModule.deleteMany(),
            prisma.course.deleteMany(),
            prisma.session.deleteMany(),
            prisma.promocode.deleteMany(),
            // Finally users and admins
            prisma.admin.deleteMany(),
            prisma.user.deleteMany(),
        ])

        // 2. Create Users

        // --- ADMINS ---
        const superAdmin = await prisma.admin.create({
            data: { email: 'superadmin@sprintern.com', passwordHash: hashedPassword, role: 'super_admin', isActive: true },
        })
        const admin = await prisma.admin.create({
            data: { email: 'admin@sprintern.com', passwordHash: hashedPassword, role: 'admin', isActive: true },
        })
        const reviewer = await prisma.admin.create({
            data: { email: 'reviewer@sprintern.com', passwordHash: hashedPassword, role: 'reviewer', isActive: true },
        })

        // --- STUDENTS ---
        // 1. Standard Student (New, exploring)
        const student = await prisma.user.create({
            data: {
                name: 'John Student',
                email: 'student@sprintern.com',
                hashedPassword: hashedPassword,
                role: 'student',
                phone: '9876543210',
                studyLevel: 'COLLEGE_3',
                walletBalance: 0.00,
                emailVerified: true,
                referralCode: 'JOHN123',
            },
        })

        // 2. Rich Student (Has money, referrals, and withdrawals)
        const richStudent = await prisma.user.create({
            data: {
                name: 'Richie Rich',
                email: 'rich@sprintern.com',
                hashedPassword: hashedPassword,
                role: 'student',
                phone: '9999999999',
                studyLevel: 'GRADUATED',
                walletBalance: 5000.00,
                emailVerified: true,
                referralCode: 'RICHIE999',
            },
        })

        // 3. Graduated Student (Completed course, has certificate)
        const gradStudent = await prisma.user.create({
            data: {
                name: 'Hermione Granger',
                email: 'grad@sprintern.com',
                hashedPassword: hashedPassword,
                role: 'student',
                phone: '8888888888',
                studyLevel: 'COLLEGE_4',
                walletBalance: 100.00,
                emailVerified: true,
                referralCode: 'HERMIONE1',
            },
        })

        // 3. Create Content

        // --- COURSE 1: Full Stack (Active, Content-Rich) ---
        const courseFs = await prisma.course.create({
            data: {
                courseId: 'FSWD-101',
                slug: 'full-stack-web-development',
                courseName: 'Full Stack Web Development',
                courseDescription: 'Master the MERN stack in 30 days',
                affiliatedBranch: 'CS_IT',
                coursePrice: 2999.00,
                courseThumbnail: 'https://placehold.co/600x400/png?text=MERN+Stack',
                problemStatementText: 'Build a fully functional E-commerce website with payment integration.',
                isActive: true,
            },
        })

        // Module 1 (Free Preview)
        await prisma.courseModule.create({
            data: {
                courseId: courseFs.id,
                dayNumber: 1,
                title: 'Introduction to Web Development',
                contentText: 'Welcome to the course! Today we will learn HTML and CSS basics.',
                isFreePreview: true,
                youtubeUrl: 'https://youtube.com/watch?v=intro',
            }
        })

        // Module 2 (Paid, Locked initially)
        await prisma.courseModule.create({
            data: {
                courseId: courseFs.id,
                dayNumber: 2,
                title: 'Advanced React Hooks',
                contentText: 'Deep dive into useEffect and useMemo.',
                isFreePreview: false,
            }
        })

        // --- COURSE 2: Data Science (Draft/Coming Soon) ---
        const courseDs = await prisma.course.create({
            data: {
                courseId: 'DS-101',
                slug: 'data-science-bootcamp',
                courseName: 'Data Science Bootcamp',
                courseDescription: 'Learn Python, Pandas, and ML.',
                affiliatedBranch: 'CS_IT',
                coursePrice: 4999.00,
                courseThumbnail: 'https://placehold.co/600x400/png?text=Data+Science',
                problemStatementText: 'Predict housing prices using regression.',
                isActive: false, // Inactive course
            },
        })


        // 4. Enrollments & Progress

        // Student -> Enrolled in FSWD (Day 1)
        const enrollStandard = await prisma.enrollment.create({
            data: {
                userId: student.id,
                courseId: courseFs.id,
                amountPaid: 2999.00,
                paymentStatus: 'success',
                paymentGatewayOrderId: 'order_std_1',
                currentDay: 1,
            }
        })
        await prisma.dailyProgress.create({
            data: { enrollmentId: enrollStandard.id, dayNumber: 1, isLocked: false, unlockedAt: new Date() }
        })

        // Grad Student -> Completed FSWD (Day 30, Certificate, Submission)
        const enrollGrad = await prisma.enrollment.create({
            data: {
                userId: gradStudent.id,
                courseId: courseFs.id,
                amountPaid: 2000.00, // Discounted
                paymentStatus: 'success',
                paymentGatewayOrderId: 'order_grad_1',
                currentDay: 30,
                day7Completed: true,
                certificateIssued: true,
                certificateId: 'CERT-FSWD-001',
                completedAt: new Date(),
            }
        })

        // Submission for Grad Student
        const submission = await prisma.submission.create({
            data: {
                enrollmentId: enrollGrad.id,
                userId: gradStudent.id,
                fullName: gradStudent.name,
                dob: null,
                collegeName: 'Hogwarts',
                collegeIdLink: 'https://college.edu/hermione',
                branch: 'Computer Science',
                graduationYear: 2024,
                driveLink: 'https://drive.google.com/hermione',
                reviewStatus: 'approved',
                assignedAdminId: reviewer.id,
                finalGrade: 9.5,
                gradeCategory: 'Distinction',
                submittedAt: new Date(Date.now() - 86400000), // Yesterday
                reviewCompletedAt: new Date(),
            }
        })

        // 5. Wallet & Referrals

        // Rich Student referred Standard Student
        await prisma.referral.create({
            data: {
                referrerId: richStudent.id,
                refereeId: student.id,
                referralCodeUsed: 'RICHIE999',
                status: 'completed',
                amount: 50.00,
                completedAt: new Date(),
            }
        })

        // Rich Student Wallet Transactions
        await prisma.transaction.create({
            data: {
                userId: richStudent.id,
                transactionType: 'referral_credit',
                amount: 50.00,
                status: 'completed',
                referralId: (await prisma.referral.findFirst())?.id,
                createdAt: new Date(Date.now() - 100000),
            }
        })

        // Rich Student Withdrawal Request
        await prisma.withdrawalRequest.create({
            data: {
                userId: richStudent.id,
                amount: 1000.00,
                upiId: 'richie@upi',
                status: 'pending',
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Database seeded with RICH mock data 🚀',
            data: {
                password: 'Password123!',
                users: [
                    { role: 'Student (New)', email: 'student@sprintern.com' },
                    { role: 'Student (Rich/Wallet)', email: 'rich@sprintern.com' },
                    { role: 'Student (Graduated)', email: 'grad@sprintern.com' },
                    { role: 'Super Admin', email: 'superadmin@sprintern.com' },
                    { role: 'Admin', email: 'admin@sprintern.com' },
                    { role: 'Reviewer', email: 'reviewer@sprintern.com' },
                ],
                courses: ['Full Stack (Active)', 'Data Science (Inactive)'],
                stats: {
                    enrollments: 2,
                    submissions: 1,
                    certificates: 1,
                    withdrawals: 1
                }
            },
        })
    } catch (error: any) {
        console.error('Seeding error:', error)
        return NextResponse.json(
            { error: 'Seeding failed', details: error.message },
            { status: 500 }
        )
    }
}
