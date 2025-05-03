/**
 * 用于导出数据到Excel的工具函数
 */

interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any) => any;
}

interface ExportOptions {
  /**
   * 要导出的数据
   */
  data: any[];
  /**
   * 表头和字段定义
   */
  headers: ExportColumn[];
  /**
   * 导出的文件名
   */
  filename: string;
}

/**
 * 将数据导出为Excel文件
 * @param options 导出选项
 */
export const exportToExcel = (options: ExportOptions) => {
  const {data, headers, filename} = options;

  // 将数据转换为CSV格式
  const csvContent = [
    // 表头行
    headers.map(col => `"${col.header}"`).join(','),
    // 数据行
    ...data.map(row => {
      return headers.map(col => {
        let value = row[col.key];

        // 如果有格式化函数，使用它来处理值
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(value);
        }

        // 处理特殊情况
        if (value === null || value === undefined) {
          return '""';
        } else if (typeof value === 'string') {
          // 对字符串进行转义，防止CSV注入
          return `"${value.replace(/"/g, '""')}"`;
        } else if (Array.isArray(value)) {
          // 数组转为字符串
          return `"${value.join(', ')}"`;
        } else {
          return `"${value}"`;
        }
      }).join(',');
    })
  ].join('\n');

  // 创建Blob对象
  const blob = new Blob(['\ufeff' + csvContent], {type: 'text/csv;charset=utf-8;'});

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
