# TCP Chat Server

A simple TCP-based chat server built with Node.js.

## How to Run the Server

### Dependencies
- Node.js (v12 or higher)
- No external npm packages required (uses built-in `net` module)

### Starting the Server
```bash
node server.js
```

The server will start on port **4000**.

## How to Connect

### Using netcat (ncat)
```bash
ncat localhost 4000
```

### Using netcat (nc)
```bash
nc localhost 4000
```

## Example Chat Session

Here's an example of two users chatting:

### User 1 (Alice)
```
$ ncat localhost 4000
INFO Welcome. Please LOGIN <username>
LOGIN alice
OK
USER alice
INFO bob connected
USER bob
MSG Hello Bob!
MSG bob Hey Alice! How are you?
DM bob I'm doing great, thanks for asking!
OK
MSG See you later everyone!
```

### User 2 (Bob)
```
$ ncat localhost 4000
INFO Welcome. Please LOGIN <username>
LOGIN bob
OK
USER alice
USER bob
MSG bob Hey Alice! How are you?
DM alice I'm doing great, thanks for asking!
MSG alice Hello Bob!
INFO alice disconnected
```

## Available Commands

- `LOGIN <username>` - Login with a username
- `MSG <message>` - Send a message to all users
- `DM <username> <message>` - Send a direct message to a specific user
- `WHO` - List all online users
- `PING` - Check connection (server responds with PONG)