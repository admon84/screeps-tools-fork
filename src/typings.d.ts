declare module 'react-json-view' {
    class ReactJson extends React.Component<{
        src: any;
        theme: string;
        name: string;
        collapsed: boolean | number;
    }>{}
    
    export default ReactJson;
}

declare module 'jq-web' {
    export default function jq(object: any, query: string): any;
}

declare module 'screeps-api' {
    type ScreepsAPIOptions = {
        token: string;
        protocol: 'http' | 'https';
        hostname: string;
        port: number;
        path: string;
    };
    
    class ScreepsAPI {
        constructor(opts: ScreepsAPIOptions);
        
        socket: WebSocket & {
            connect(): Promise<any>;
            subscribe(channel: string): void;
            on(event: string, handler: (event: Event) => void): void;
            disconnect(): void;
        };
    }
}