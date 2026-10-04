'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { uberBlackTheme } from '@/theme/uberBlackTheme';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={uberBlackTheme} locale={esES}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
