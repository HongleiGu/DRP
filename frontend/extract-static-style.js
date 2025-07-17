import { extractStyle } from '@ant-design/static-style-extract';
import fs from 'fs';

// `extractStyle` containers all the antd component
// excludes popup like component which is no need in ssr: Modal, message, notification, etc.
const css = extractStyle();

fs.writeFile('public/antd.css', css, (err) => {
  if (err) {
    console.error('Error writing CSS file:', err);
  } else {
    console.log('CSS file written successfully to public/antd.css');
  }
})