const Fastify = require('fastify');
const { exec } = require('child_process');

const fastify = Fastify({ logger: true });
const PORT = 6600;

function checkDiskSpace() {
  return new Promise((resolve, reject) => {
    exec("df -h | grep '/dev/nvme0n1p1'", (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const [filesystem, size, used, available, usePercentage, mountPoint] = stdout.split(/\s+/);
        resolve({ filesystem, size, used, available, usePercentage });
      }
    });
  });
}

function checkTmpStorage() {
  return new Promise((resolve, reject) => {
    exec('df -h "/tmp"', (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const lines = stdout.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          const [filesystem, size, used, available, usePercentage, mountPoint] = lines[1].split(/\s+/);
          resolve({ filesystem, size, used, available, usePercentage });
        } else {
          reject(new Error('Unexpected output format for /tmp storage check.'));
        }
      }
    });
  });
}

function checkMemoryUsage() {
  return new Promise((resolve, reject) => {
    exec("free -m", (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const lines = stdout.split('\n');
        const memoryData = lines[1].split(/\s+/);
        const total = parseInt(memoryData[1], 10);
        const used = parseInt(memoryData[2], 10);
        const free = parseInt(memoryData[3], 10);
        const usage = Math.round((used / total) * 100);
        resolve({ total, used, free, usage });
      }
    });
  });
}

function checkCpuUsage() {
  return new Promise((resolve, reject) => {
    exec("top -bn1 | grep 'Cpu(s)'", (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const cpuData = stdout.match(/\d+\.\d+/g);
        const usage = parseFloat(cpuData[0]);
        resolve({ usage });
      }
    });
  });
}

function checkThreads() {
  return new Promise((resolve, reject) => {
    exec("ls /proc/$(lsof -ti :8888)/fd | wc -l", (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const count = parseInt(stdout.trim(), 10);
        resolve({ threadCount: count });
      }
    });
  });
}

fastify.get('/', async (req, reply) => {
  try {
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    
    reply.status(200).send({
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      uptimeSeconds: Math.floor(uptime),
      port: PORT,
      endpoints: {
        '/': 'Server status',
        '/space': 'Disk space usage',
        '/tmp': 'Tmp storage usage', 
        '/memory': 'Memory usage',
        '/cpu': 'CPU usage',
        '/threads': 'Thread count'
      }
    });
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving server status.',
      error: error.message,
    });
  }
});

fastify.get('/space', async (req, reply) => {
  try {
    const diskSpace = await checkDiskSpace();
    const usage = parseInt(diskSpace.usePercentage.replace('%', ''), 10);

    if (usage < 70) {
      reply.status(200).send({
        message: 'Disk usage is within safe limits.',
        details: diskSpace,
      });
    } else if (usage <= 90) {
      reply.status(429).send({
        message: 'Disk usage is high. Consider freeing up some space.',
        details: diskSpace,
      });
    } else {
      reply.status(500).send({
        message: 'Disk usage is critically high! Immediate action required.',
        details: diskSpace,
      });
    }
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving disk space information.',
      error: error.message,
    });
  }
});

fastify.get('/tmp', async (req, reply) => {
  try {
    const tmpStorage = await checkTmpStorage();
    const usage = parseInt(tmpStorage.usePercentage.replace('%', ''), 10);

    if (usage < 70) {
      reply.status(200).send({
        message: 'Tmp storage usage is within safe limits.',
        details: tmpStorage,
      });
    } else if (usage <= 90) {
      reply.status(429).send({
        message: 'Tmp storage usage is high. Consider freeing up some space.',
        details: tmpStorage,
      });
    } else {
      reply.status(500).send({
        message: 'Tmp storage usage is critically high! Immediate action required.',
        details: tmpStorage,
      });
    }
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving tmp storage information.',
      error: error.message,
    });
  }
});

fastify.get('/memory', async (req, reply) => {
  try {
    const memoryUsage = await checkMemoryUsage();

    if (memoryUsage.usage < 70) {
      reply.status(200).send({
        message: 'Memory usage is within safe limits.',
        details: memoryUsage,
      });
    } else if (memoryUsage.usage <= 90) {
      reply.status(429).send({
        message: 'Memory usage is high. Consider optimizing memory usage.',
        details: memoryUsage,
      });
    } else {
      reply.status(500).send({
        message: 'Memory usage is critically high! Immediate action required.',
        details: memoryUsage,
      });
    }
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving memory usage information.',
      error: error.message,
    });
  }
});

fastify.get('/cpu', async (req, reply) => {
  try {
    const cpuUsage = await checkCpuUsage();

    if (cpuUsage.usage < 70) {
      reply.status(200).send({
        message: 'CPU usage is within safe limits.',
        details: cpuUsage,
      });
    } else if (cpuUsage.usage <= 90) {
      reply.status(429).send({
        message: 'CPU usage is high. Consider optimizing CPU usage.',
        details: cpuUsage,
      });
    } else {
      reply.status(500).send({
        message: 'CPU usage is critically high! Immediate action required.',
        details: cpuUsage,
      });
    }
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving CPU usage information.',
      error: error.message,
    });
  }
});

fastify.get('/threads', async (req, reply) => {
  try {
    const threads = await checkThreads();
    if (threads.threadCount < 4000) {
      reply.status(200).send({
        message: 'Thread count is within safe limits.',
        details: threads,
      });
    } else if (threads.threadCount <= 5000) {
      reply.status(429).send({
        message: 'Thread count is high. Consider investigating open file descriptors.',
        details: threads,
      });
    } else {
      reply.status(500).send({
        message: 'Thread count is critically high! Immediate action required.',
        details: threads,
      });
    }
  } catch (error) {
    reply.status(500).send({
      message: 'Error retrieving thread count.',
      error: error.message,
    });
  }
});

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server is running at ${address}`);
});
