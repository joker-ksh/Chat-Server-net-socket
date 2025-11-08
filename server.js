const net = require("net");

const PORT = 4000;

// Store users: username → socket
const users = new Map();

// Store session info: socket → { name, buffer }
const sessions = new Map();

function send(sock, msg) {
  try {
    sock.write(msg + "\n");
  } catch {}
}

function broadcast(msg, exceptSock = null) {
  for (const s of users.values()) {
    if (s !== exceptSock) send(s, msg);
  }
}

function clean(text) {
  return text.trim();
}

function isValidUsername(name) {
  if (!name) return false;

  // only A-Z, a-z, 0-9, _
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    const isLetter = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
    const isDigit = c >= '0' && c <= '9';
    if (!isLetter && !isDigit && c !== '_') return false;
  }

  // Reserved keywords
  const reserved = ["INFO", "MSG", "DM", "USER", "OK", "ERR", "PING", "PONG", "WHO"];
  if (reserved.includes(name.toUpperCase())) return false;

  return true;
}

function login(sock, username) {
  username = clean(username);

  if (!isValidUsername(username)) return send(sock, "ERR invalid-username");
  if (users.has(username)) return send(sock, "ERR username-taken");

  users.set(username, sock);
  sessions.get(sock).name = username;

  send(sock, "OK");

  // send current users
  for (const name of users.keys()) {
    send(sock, "USER " + name);
  }

  // alert others
  broadcast(`INFO ${username} connected`, sock);
}

function removeUser(sock) {
  const session = sessions.get(sock);
  if (!session) return;

  const username = session.name;
  if (username && users.get(username) === sock) {
    users.delete(username);
    broadcast(`INFO ${username} disconnected`, sock);
  }

  sessions.delete(sock);
}

function handleCommand(sock, line) {
  const session = sessions.get(sock);
  const username = session.name;

  if (line === "PING") {
    send(sock, "PONG");
    return;
  }

  if (!username) {
    if (line.startsWith("LOGIN ")) {
      login(sock, line.slice(6));
    } else {
      send(sock, "ERR not-logged-in");
    }
    return;
  }

  if (line.startsWith("MSG ")) {
    const msg = clean(line.slice(4));
    if (msg) broadcast(`MSG ${username} ${msg}`);
    return;
  }

  if (line === "WHO") {
    for (const name of users.keys()) send(sock, "USER " + name);
    return;
  }

  if (line.startsWith("DM ")) {
    const spaceIndex = line.indexOf(" ", 3);
    if (spaceIndex === -1) return send(sock, "ERR bad-dm");

    const target = line.slice(3, spaceIndex).trim();
    const text = clean(line.slice(spaceIndex + 1));

    if (!target || !text) return send(sock, "ERR bad-dm");

    const targetSock = users.get(target);
    if (!targetSock) return send(sock, "ERR no-such-user");

    send(targetSock, `DM ${username} ${text}`);
    send(sock, "OK");
    return;
  }

  send(sock, "ERR unknown-command");
}


const server = net.createServer(sock => {
  sock.setEncoding("utf8");

  // sock.setKeepAlive(true, 10000); // sends keepalive every 10 seconds

  sessions.set(sock, { name: null, buffer: "" });
  send(sock, "INFO Welcome. Please LOGIN <username>");

  sock.on("data", chunk => {
    const session = sessions.get(sock);
    if (!session) return;

    session.buffer += chunk;

    let newlineIndex;
    while ((newlineIndex = session.buffer.indexOf("\n")) !== -1) {
      const line = session.buffer.slice(0, newlineIndex).trim();
      session.buffer = session.buffer.slice(newlineIndex + 1);

      if (line) handleCommand(sock, line);
    }

    if (session.buffer.length > 2000) session.buffer = "";
  });

  sock.on("close", () => removeUser(sock));
  sock.on("error", () => removeUser(sock));
});

server.listen(PORT, () => {
  console.log("Chat server running on port", PORT);
});
