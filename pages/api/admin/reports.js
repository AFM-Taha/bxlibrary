import { withAdminAuth } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Book from '../../../models/Book';
import Category from '../../../models/Category';
import ReadingSession from '../../../models/ReadingSession';

async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getReports(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getReports(req, res) {
  try {
    const { type = 'overview', period = '30' } = req.query;
    const periodDays = parseInt(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    switch (type) {
      case 'overview':
        return await getOverviewReport(req, res, startDate);
      case 'users':
        return await getUsersReport(req, res, startDate);
      case 'books':
        return await getBooksReport(req, res, startDate);
      case 'reading':
        return await getReadingReport(req, res, startDate);
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getOverviewReport(req, res, startDate) {
  try {
    // Get total counts
    const [totalUsers, activeUsers, totalBooks, publishedBooks, totalCategories, recentSessions] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ status: 'active', isDeleted: { $ne: true } }),
      Book.countDocuments({ isDeleted: { $ne: true } }),
      Book.countDocuments({ status: 'published', isDeleted: { $ne: true } }),
      Category.countDocuments({ isDeleted: { $ne: true } }),
      ReadingSession.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    // Get new users in period
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate },
      isDeleted: { $ne: true }
    });

    // Get new books in period
    const newBooks = await Book.countDocuments({
      createdAt: { $gte: startDate },
      isDeleted: { $ne: true }
    });

    // Get most read books
    const topBooks = await Book.find({
      isDeleted: { $ne: true },
      status: 'published'
    })
      .sort({ readCount: -1 })
      .limit(5)
      .select('title author readCount')
      .lean();

    // Get recent user activity
    const recentUsers = await User.find({
      lastLogin: { $gte: startDate },
      isDeleted: { $ne: true }
    })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email lastLogin')
      .lean();

    const overview = {
      totals: {
        users: totalUsers,
        activeUsers,
        books: totalBooks,
        publishedBooks,
        categories: totalCategories
      },
      period: {
        newUsers,
        newBooks,
        readingSessions: recentSessions
      },
      topBooks: topBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        readCount: book.readCount
      })),
      recentActivity: recentUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      }))
    };

    res.status(200).json({ overview });
  } catch (error) {
    console.error('Get overview report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUsersReport(req, res, startDate) {
  try {
    // User status distribution
    const usersByStatus = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // User role distribution
    const usersByRole = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // User registrations over time (last 30 days)
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Users with expiring accounts (next 30 days)
    const expiringUsers = await User.find({
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      isDeleted: { $ne: true }
    })
      .select('name email expiryDate')
      .sort({ expiryDate: 1 })
      .limit(10)
      .lean();

    const usersReport = {
      statusDistribution: usersByStatus,
      roleDistribution: usersByRole,
      registrationTrend,
      expiringUsers: expiringUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        expiryDate: user.expiryDate
      }))
    };

    res.status(200).json({ usersReport });
  } catch (error) {
    console.error('Get users report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBooksReport(req, res, startDate) {
  try {
    // Books by status
    const booksByStatus = await Book.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Books by category
    const booksByCategory = await Book.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          category: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Book additions over time
    const additionTrend = await Book.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Most popular books
    const popularBooks = await Book.find({
      isDeleted: { $ne: true },
      status: 'published'
    })
      .populate('category', 'name')
      .sort({ readCount: -1 })
      .limit(10)
      .select('title author readCount category')
      .lean();

    const booksReport = {
      statusDistribution: booksByStatus,
      categoryDistribution: booksByCategory,
      additionTrend,
      popularBooks: popularBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        category: book.category?.name || 'Uncategorized',
        readCount: book.readCount
      }))
    };

    res.status(200).json({ booksReport });
  } catch (error) {
    console.error('Get books report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getReadingReport(req, res, startDate) {
  try {
    // Reading sessions over time
    const sessionTrend = await ReadingSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          sessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Most active readers
    const activeReaders = await ReadingSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 }
    ]);

    // Reading patterns by hour
    const hourlyPattern = await ReadingSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const readingReport = {
      sessionTrend,
      activeReaders: activeReaders.map(reader => ({
        id: reader._id,
        name: reader.userInfo.name,
        email: reader.userInfo.email,
        sessionCount: reader.sessionCount,
        totalDuration: reader.totalDuration
      })),
      hourlyPattern
    };

    res.status(200).json({ readingReport });
  } catch (error) {
    console.error('Get reading report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAdminAuth(handler);