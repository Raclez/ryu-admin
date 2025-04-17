import {createRequire} from 'module';

const require = createRequire(import.meta.url);

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 从civitai.com爬取指定数量的图片URL
 * @param {number} maxImages - 要爬取的最大图片数量
 * @param {string} baseUrl - 要爬取的起始URL
 * @returns {Promise<string[]>} - 爬取到的图片URL数组
 */
async function scrapeCivitaiImageUrls(maxImages = 100, baseUrl = 'https://civitai.com/images') {
  // 存储所有图片URL的数组
  let allImageUrls = [];

  // 存储网络请求中的图片URL
  let networkImageUrls = [];

  // 浏览器启动选项
  const options = {
    headless: false,  // 有界面模式，便于调试
    defaultViewport: {width: 1920, height: 1080},
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      // 可选代理
      // '--proxy-server=http://127.0.0.1:7890',
    ],
    timeout: 120000 // 2分钟启动超时
  };

  console.log(`开始爬取，目标图片数量: ${maxImages}`);

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  try {
    // 设置更现代的用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // 设置导航超时
    await page.setDefaultNavigationTimeout(120000);

    // 监听网络请求，捕获图片URL
    page.on('request', request => {
      const url = request.url();
      // 只捕获civitai的图片URL
      if (
        url.includes('https://') &&
        (url.includes('image.civitai.com') ||
          url.includes('imagecache.civitai.com') ||
          url.includes('civitai.com/api/download/'))
      ) {
        const cleanUrl = url.split('?')[0]; // 移除URL参数
        if (!networkImageUrls.includes(cleanUrl)) {
          networkImageUrls.push(cleanUrl);
        }
      }
    });

    // 访问页面
    console.log(`访问网站: ${baseUrl}`);
    await page.goto(baseUrl, {waitUntil: 'networkidle2'});

    // 等待图片元素加载
    try {
      console.log('等待页面图片加载...');
      await page.waitForSelector('img[src*="https://"]', {timeout: 60000});
      console.log('页面图片已加载');
    } catch (error) {
      console.warn('等待图片加载超时，继续执行:', error.message);
    }

    // 检查是否有Cookie同意对话框，如果有则关闭它
    try {
      const cookieConsent = await page.$('button[data-testid="cookie-consent-accept"], .cookie-consent-button, [aria-label="accept cookies"]');
      if (cookieConsent) {
        console.log('关闭Cookie同意对话框...');
        await cookieConsent.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log('没有发现Cookie同意对话框或无法关闭:', error.message);
    }

    console.log('开始自动滚动页面收集图片URL...');

    // 持续滚动并收集URL，直到达到目标数量或无法加载更多
    let noNewImagesCount = 0;
    const maxNoNewImagesAttempts = 10; // 最大无新图片尝试次数
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // 最大滚动尝试次数

    while (
      allImageUrls.length < maxImages &&
      noNewImagesCount < maxNoNewImagesAttempts &&
      scrollAttempts < maxScrollAttempts
      ) {
      scrollAttempts++;
      console.log(`\n===== 滚动尝试 #${scrollAttempts} =====`);

      // 记录滚动前的位置
      const scrollBefore = await page.evaluate(() => window.scrollY);
      console.log(`滚动前位置: ${scrollBefore}px`);

      // 自动滚动页面
      await autoScrollPage(page);

      // 记录滚动后的位置
      const scrollAfter = await page.evaluate(() => window.scrollY);
      console.log(`滚动后位置: ${scrollAfter}px (变化: ${scrollAfter - scrollBefore}px)`);

      // 获取当前页面上的所有图片URL
      const currentUrls = await page.evaluate(() => {
        const imgElements = Array.from(document.querySelectorAll('img'));
        return imgElements
          .map(img => img.src)
          .filter(src => {
            // 必须是https链接
            if (!src || !src.includes('https://')) return false;

            // 排除特定类型的图片
            if (src.includes('data:image')) return false;
            if (src.includes('thumbnail')) return false;
            if (src.includes('/icon')) return false;
            if (src.includes('/logo')) return false;
            if (src.includes('/avatar')) return false;

            // 符合civitai图片URL特征的
            const isCivitaiImage =
              src.includes('civitai.com/api/download/') ||
              src.includes('image.civitai.com') ||
              src.includes('imagecache.civitai.com');

            return isCivitaiImage;
          })
          .map(src => src.replace(/\?.*$/, '')); // 移除所有URL参数
      });

      // 添加新的URL到结果数组（去重）
      const initialLength = allImageUrls.length;
      const uniqueUrls = [...new Set([...allImageUrls, ...currentUrls])];
      allImageUrls = uniqueUrls;

      // 如果超过最大数量，截断数组
      if (allImageUrls.length > maxImages) {
        allImageUrls = allImageUrls.slice(0, maxImages);
      }

      const newUrlsCount = allImageUrls.length - initialLength;

      // 检查是否有新图片加载
      if (newUrlsCount > 0) {
        console.log(`已收集 ${allImageUrls.length}/${maxImages} 张图片的URL，本次新增: ${newUrlsCount}张`);
        if (newUrlsCount > 0 && allImageUrls.length > 0) {
          console.log(`最新图片URL示例: ${allImageUrls[allImageUrls.length - 1]}`);
        }
        noNewImagesCount = 0; // 重置计数器
      } else {
        noNewImagesCount++;
        console.log(`未发现新图片，继续尝试滚动... (${noNewImagesCount}/${maxNoNewImagesAttempts})`);

        // 如果连续多次没有新图片，尝试其他策略
        if (noNewImagesCount % 3 === 0) {
          console.log('多次未发现新图片，保存页面截图以便调试...');
          await page.screenshot({path: `debug_screenshot_${noNewImagesCount}.png`});

          // 尝试点击"加载更多"按钮
          try {
            const loadMoreButton = await page.$('button:contains("Load More"), button:contains("加载更多"), [aria-label="load more"]');
            if (loadMoreButton) {
              console.log('找到"加载更多"按钮，尝试点击...');
              await loadMoreButton.click();

              await new Promise(resolve => setTimeout(resolve, 3000));
              noNewImagesCount--; // 减少计数，给更多尝试机会
            }
          } catch (error) {
            console.log('尝试点击"加载更多"按钮失败:', error.message);
          }
        }

        // 如果已经尝试了很多次，考虑刷新页面
        if (noNewImagesCount > 5) {
          console.log('尝试刷新页面...');
          await page.reload({waitUntil: 'networkidle2'});
          await new Promise(resolve => setTimeout(resolve, 2000));
          noNewImagesCount = 0; // 重置计数器
        }
      }

      // 等待一会儿让页面加载
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 合并网络请求中获取的图片URL
    console.log(`\n===== 处理网络请求中的图片URL =====`);
    console.log(`从网络请求中捕获了 ${networkImageUrls.length} 个图片URL`);

    if (networkImageUrls.length > 0) {
      // 计算DOM和网络请求URL的差异
      const domUrlsSet = new Set(allImageUrls);
      const uniqueNetworkUrls = networkImageUrls.filter(url => !domUrlsSet.has(url));

      console.log(`网络请求中独有的图片URL: ${uniqueNetworkUrls.length}个`);

      // 合并两个来源的URL
      const combinedUrls = [...allImageUrls, ...uniqueNetworkUrls];
      allImageUrls = [...new Set(combinedUrls)].slice(0, maxImages);
    }

    // 最终结果
    if (allImageUrls.length >= maxImages) {
      console.log(`\n完成爬取！已达到目标数量: ${maxImages}个图片URL`);
    } else {
      console.log(`\n完成爬取！收集到 ${allImageUrls.length} 个图片URL (未达到目标${maxImages}，可能是因为页面没有更多图片)`);
    }

    // 将结果保存到文件
    // const outputFile = path.join(__dirname, 'civitai_image_urls.json');
    // fs.writeFileSync(outputFile, JSON.stringify(allImageUrls, null, 2));
    // console.log(`图片URL已保存到: ${outputFile}`);
    console.log("爬取的最终结果", JSON.stringify(allImageUrls, null, 2))
    return JSON.stringify(allImageUrls, null, 2);

  } catch (error) {
    console.error('爬取过程中发生错误:', error);
    return allImageUrls; // 返回已收集的URL
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log('浏览器已关闭');
  }
}

/**
 * 自动滚动页面加载更多内容
 * @param {Page} page - Puppeteer页面对象
 */
async function autoScrollPage(page) {
  console.log('执行页面滚动...');

  // 记录滚动前的位置，用于验证滚动是否有效
  const beforeScroll = await page.evaluate(() => window.scrollY);

  // 执行滚动操作
  const scrollResult = await page.evaluate(async () => {
    return await new Promise((resolve) => {
      // 设置滚动参数
      const scrollDistance = Math.floor(window.innerHeight * 0.8); // 滚动80%视窗高度
      const scrollDelay = 500; // 每次滚动间隔时间(毫秒)
      const maxScrolls = 5; // 最大滚动次数

      let scrollCount = 0;
      let totalScrolled = 0;
      const initialScrollY = window.scrollY;

      // 创建滚动间隔
      const scrollInterval = setInterval(() => {
        // 执行滚动
        window.scrollBy(0, scrollDistance);
        totalScrolled += scrollDistance;
        scrollCount++;

        // 如果已经滚动到底部或达到最大滚动次数，停止滚动
        if (
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100 ||
          scrollCount >= maxScrolls
        ) {
          clearInterval(scrollInterval);
          resolve({
            initialPosition: initialScrollY,
            finalPosition: window.scrollY,
            totalScrolled: totalScrolled,
            reachedBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100,
            scrollCount: scrollCount
          });
        }
      }, scrollDelay);
    });
  });

  // 等待新内容加载
  console.log(`滚动结果: 从${scrollResult.initialPosition}px滚动到${scrollResult.finalPosition}px，共${scrollResult.totalScrolled}px`);
  if (scrollResult.reachedBottom) {
    console.log('已到达页面底部');
  }

  // 等待内容加载
  console.log('等待新内容加载...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 验证滚动是否有效
  const afterScroll = await page.evaluate(() => window.scrollY);
  if (afterScroll <= beforeScroll) {
    console.log('警告: 滚动似乎没有生效，尝试替代方法');

    // 替代滚动方法 - 使用鼠标滚轮事件
    await page.evaluate(() => {
      // 创建和触发滚轮事件
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 1000,
        bubbles: true
      });
      document.dispatchEvent(wheelEvent);
    });

    // 再次等待
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 或者直接跳转到更大的偏移量
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.5);
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 尝试点击页面以触发可能的交互
//   try {
//     const viewportHeight = await page.evaluate(() => window.innerHeight);
//     const viewportWidth = await page.evaluate(() => window.innerWidth);

//     // 在页面中部点击，以触发可能的交互
//     await page.mouse.click(
//       viewportWidth / 2,
//       viewportHeight / 2
//     );
//   } catch (error) {
//     console.log('点击操作失败', error.message);
//   }
}

// 调用函数开始爬取，参数: 最大图片数量, 基础URL
scrapeCivitaiImageUrls(50, 'https://civitai.com/images');
