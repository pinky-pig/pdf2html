import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundEffect } from '../components/BackgroundEffect';
import { transFile, uploadFile, getTaskStatus } from '../api';
import { useFileStore } from '../store/fileStore';
const Home: FC = () => {
  const { convertHistory, addHistoryItem, updateHistoryItem } = useFileStore();

  const [tempUploadFileName, setTempUploadFileName] = useState('');

  function handleGetFileFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files;
    if (file && file.length > 0) {
      setTempUploadFileName(file[0].name);
    }
  }

  async function handleUploadFile() {
    // todo: transform之后需要将 input 的文件清空，否则不会触发 onchange
    const file = document.getElementById('file') as HTMLInputElement;
    const fileList = file.files;
    
    if (fileList && fileList.length > 0) {
      setTempUploadFileName('');
      const formData = new FormData();
      formData.append('file', fileList[0]);
      const response = await uploadFile(formData);

      handleTransFile('http://localhost:8090' + response.url, fileList[0])
    }
    else {
      alert('请先选择文件')
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
    convertHistory.forEach(async (item) => {
      console.log('页面加载完成，开始轮询任务状态')
      if (item.status !== 'completed' ) {
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

  return (
    <>
      <BackgroundEffect />

      <div className={`bg-white relative min-h-screen p-8 font-mono text-sm flex flex-col justify-start items-start overflow-hidden }`}>

        <motion.div
          className=" z-10 gap-8 flex flex-col"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="flex items-center gap-2 font-medium">
              <a className="flex items-center gap-2" href="/">blog</a> /
              <a href="https://twitter.com/shadcn" target="_blank" rel="noreferrer">twitter</a> /
              <a href="https://github.com/pinky-pig/pdf2html" target="_blank" rel="noreferrer">github</a>
            </div>
          </motion.div>

          <motion.span
            className="text-balance font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <p>
              使用 pdf2htmlEX 将 PDF 转换为 HTML
            </p>
            <p>
              上传 PDF 文件，生成 HTML 文件
            </p>
          </motion.span>

          <motion.div
            className="flex flex-col md:flex-row justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <p
              onClick={() => {
                const file = document.getElementById('file') as HTMLInputElement;
                file.click();
              }}
              className="w-full bg-white border flex justify-start items-center border-gray-200  h-7 px-2"
            >
              <span
                className={`text-xs font-mono ${tempUploadFileName ? 'text-black' : 'text-gray-400'}`}
              >
                {tempUploadFileName || '点击选择文件EN NAME'}
              </span>
            </p>

            <button
              type="submit"
              onClick={handleUploadFile}
              className="h-7 w-16 flex-shrink-0 px-2 bg-[#e0e0e0] border border-[#919191] text-black no-underline"
            >转换</button>

            <input accept="application/pdf" onChange={handleGetFileFromInput} className="hidden" type="file" id="file" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <a href="https://github.com/pdf2htmlEX/pdf2htmlEX" target="_blank" rel="noopener noreferrer">
              去看一下 pdf2htmlEX 的仓库
            </a>
          </motion.div>

          {
            convertHistory.length > 0 && (
              <motion.div
                className="flex flex-col md:flex-row justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2 ">文件名</th>
                      <th className="border border-gray-300 p-2">状态</th>
                      <th className="border border-gray-300 p-2">查看结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convertHistory.map((item) => (
                      <tr key={item.taskId}>
                        <td className="border border-gray-300 p-2">{item.originalFile.name}</td>
                        <td className="border border-gray-300 p-2">{item.status}</td>
                        <td className="border border-gray-300 p-2">
                          {item.status === "completed" ? (
                            <a
                              href={'http://localhost:8090' + item.result}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              查看结果
                            </a>
                          ) : item.status === "failed" ? (
                            '处理失败'
                          ) : (
                            <div>
                                处理中
                                <span className="blink">.</span>
                                <span className="blink">.</span>
                                <span className="blink">.</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )
          }

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
