import { FC, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BackgroundEffect } from '../components/BackgroundEffect';
import { FuturisticButton } from '../components/FuturisticButton';
import { transFile, uploadFile, getTaskStatus } from '../api';
import { useFileStore } from '../store/fileStore';
const Home: FC = () => {
  const isDarkMode = 'dark';

  const { convertHistory, addHistoryItem, updateHistoryItem } = useFileStore();

  async function handleUploadFile() {
    const file = document.getElementById('file') as HTMLInputElement;
    const fileList = file.files;

    if (fileList && fileList.length > 0) {
      const formData = new FormData();
      formData.append('file', fileList[0]);
      const response = await uploadFile(formData);

      const tempFileUrl = 'http://localhost:8090' + response.url;

      handleTransFile(tempFileUrl, fileList[0])
    }
  }

  async function handleTransFile(tempFileUrl: string, file: File) {
    if (tempFileUrl) {
      const response = await transFile({ pdf_url: tempFileUrl });
      
      // 使用 addHistoryItem 添加新记录
      addHistoryItem({ 
        originalFile: { 
          name: file.name, 
          size: file.size, 
          type: file.type, 
          url: tempFileUrl 
        }, 
        status: response.status, 
        taskId: response.task_id 
      });

      try {
        const taskResult = await pollTaskStatus(response.task_id);
        // 使用 updateHistoryItem 更新状态
        updateHistoryItem(response.task_id, {
          status: taskResult.status,
          result: taskResult.result
        });
      } catch (error) {
        updateHistoryItem(response.task_id, {
          status: 'failed',
          error: error as string
        });
      }
    }
  }

  useEffect(() => {
    console.log('页面加载完成，开始轮询任务状态')
    convertHistory.forEach(async (item) => {
      if (item.status === 'pending') {
        const status = await pollTaskStatus(item.taskId);
        updateHistoryItem(item.taskId, {
          status: status.status,
          result: status.result,
          pdfUrl: status.pdf_url,
          updatedAt: status.updated_at
        });
      }
    });
  }, []);

  

  async function pollTaskStatus(taskId: string): Promise<{
    created_at: number
    error: string | null
    pdf_url: string
    result: string | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    task_id: string
    updated_at: number
  }> {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await getTaskStatus(taskId);

          switch (response.status) {
            case 'completed':
              resolve(response);
              break;
            case 'failed':
              reject(new Error(response.error || '转换失败'));
              break;
            default:
              // 继续轮询
              setTimeout(checkStatus, 2000); // 每2秒检查一次
          }
        } catch (error) {
          reject(error);
        }
      };

      // 开始轮询
      checkStatus();
    });
  }

  async function handleOpenFile(htmlFileUrl: string) {
    if (htmlFileUrl) {
      window.open(htmlFileUrl, '_blank');
    }
  }


  return (
    <>
      <BackgroundEffect />

      <div className={`relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : ''}`}>
        <motion.div
          className="max-w-4xl mx-auto text-center z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
              PDF 转 HTML
            </span>
          </motion.h1>

          <motion.p
            className={`text-xl md:text-2xl mb-12 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            上传PDF文件，生成HTML文件
          </motion.p>

          <motion.div
            className="flex flex-col md:flex-row justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <input accept="application/pdf" type="file" id="file" />
            <FuturisticButton onClick={handleUploadFile} variant="neon" size="lg">
              上传
            </FuturisticButton>
          </motion.div>


          <motion.div
            className="flex flex-col md:flex-row justify-center gap-4 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {/* {
                htmlFileUrl && (<FuturisticButton  onClick={handleOpenFile} variant="outline" size="lg">
                  打开HTML
                </FuturisticButton>) 
              } */}
          </motion.div>


          <div>
            {convertHistory.map((item) => (
              <div key={item.taskId}>
                <p>文件名: {item.originalFile.name}</p>
                <p>状态: {item.status}</p>
                {item.result && (
                  <a href={'http://localhost:8090'+item.result} target="_blank" rel="noopener noreferrer">
                    查看结果
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>


      </div>
    </>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variants: any;
  glowColor: string;
}


export default Home;
