/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'calendar-date': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
            'calendar-month': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
            'calendar-range': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
        }
    }
}
