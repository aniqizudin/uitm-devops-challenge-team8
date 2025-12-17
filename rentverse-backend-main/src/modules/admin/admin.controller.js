const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all activity logs (Newest first)
exports.getSecurityLogs = async (req, res) => {
  try {
    // 1. Fetch from the NEW table 'activityLog'
    const rawLogs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' }, // Sort by new timestamp
      take: 50,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // 2. Convert data so your Frontend still understands it
    // (Your frontend expects 'createdAt', but database has 'timestamp')
    const logs = rawLogs.map(log => ({
      ...log,
      createdAt: log.timestamp // Map timestamp to createdAt
    }));

    res.json({
      message: "Activity Logs retrieved successfully",
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Server error fetching logs" });
  }
};

// 2. Ban an IP Address
exports.banIp = async (req, res) => {
  const { ipAddress } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ error: 'IP Address is required' });
  }

  try {
    // Check if already banned
    const existing = await prisma.blockedIp.findUnique({
      where: { ipAddress }
    });

    if (existing) {
      return res.status(200).json({ message: 'IP is already banned' });
    }

    // Create the ban
    await prisma.blockedIp.create({
      data: { 
        ipAddress,
        reason: 'Banned by Admin via Dashboard' 
      }
    });

    console.log(`🚫 Banned IP: ${ipAddress}`);
    res.status(200).json({ success: true, message: `IP ${ipAddress} has been banned.` });

  } catch (error) {
    console.error('Ban Error:', error);
    res.status(500).json({ error: 'Failed to ban IP' });
  }
};

// 3. Delete Logs Older Than 30 Days
exports.cleanupLogs = async (req, res) => {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 30);

    // Note: We use 'timestamp' because that is what your database uses (seen in getSecurityLogs)
    const result = await prisma.activityLog.deleteMany({
      where: {
        timestamp: {
          lt: dateThreshold // 'lt' means Less Than (older than)
        }
      }
    });

    console.log(`🧹 Deleted ${result.count} old logs`);
    res.status(200).json({ success: true, count: result.count, message: `Cleaned up ${result.count} logs.` });

  } catch (error) {
    console.error('Cleanup Error:', error);
    res.status(500).json({ error: 'Failed to clean logs' });
  }
};