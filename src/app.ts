import * as express from 'express';
import * as path from 'path';
import * as superagent from 'superagent';
import * as zlib from 'zlib';
import * as SocketIO from 'socket.io';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import {ScreepsAPI} from 'screeps-api';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/js', express.static('public/js'));
app.use('/img', express.static('public/img'));
app.use('/css', express.static('public/css'));

app.get('/api/shards', (req, res) => {
    let url = 'https://screeps.com/api/game/shards/info';
    superagent.get(url).end((err, agentRes) => {
        if (agentRes) {
            res.json(agentRes.body);
        } else {
            res.end();
        }
    });
});

app.get('/api/terrain/:shard/:room', (req, res) => {
    let url = 'https://screeps.com/api/game/room-terrain?room=' + req.params.room +  '&encoded=1&shard=' + req.params.shard;
    superagent.get(url).end((err, agentRes) => {
        if (agentRes) {
            res.json(agentRes.body);
        } else {
            res.end();
        }
    });
});

app.get('/api/memory/:shard', (req, res) => {
    let url = 'https://screeps.com/api/user/memory?shard=' + req.params.shard;
    superagent.get(url).set({'X-Token': req.get('X-Token')}).end((err, agentRes) => {
        if (agentRes) {
            let buf = Buffer.from(agentRes.body.data.slice(3), 'base64');
            zlib.gunzip(buf, (err, ret) => {
                res.json(JSON.parse(ret.toString()));
            })
        } else {
            res.json({});
        }
    });
});

/*app.post('/slack/creep', (req, res) => {
    let creepDesigner = new CreepDesigner({api: true});
    
    creepDesigner.import({
        noState: true,
        target: {
            value: req.body.text
        }
    });
    
    res.json({
        response_type: 'in_channel',
        text: 'Your creep is done',
        attachments: [
            {
                text: creepDesigner.shareLink()
            }
        ]
    });
});*/

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

let server = http.createServer(app); // default port: 3000

let io = SocketIO(server);

io.on('connection', (socket) => {
    socket.emit('welcome', {ok: true});
    
    socket.on('connect-console', (data) => {
        let api = new ScreepsAPI({
            token: data.token,
            protocol: 'https',
            hostname: 'screeps.com',
            port: 443,
            path: '/'
        });
        
        api.socket.connect().then(() => {
            api.socket.subscribe('console');
            api.socket.on('console', (event) => {
                socket.emit('message', event)
            });
            
            socket.on('disconnect', () => {
                api.socket.disconnect()
            });
        }).catch((e: Error) => {
            socket.emit('message', {
                channel: 'console',
                id: 'err',
                data: {
                    messages: {
                        log: [e.message]
                    },
                    shard: 'shard0'
                },
                type: 'user'
            });
        });
        
    });
});

server.listen(3000);