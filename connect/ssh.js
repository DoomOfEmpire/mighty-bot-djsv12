const ssh = new NodeSSH();
ssh.connect({
    host: "localhost",
    username: "gabriel",
    password: "gabriel",
}).then(() => {
    console.log("SSH: Connected.");
}).catch(() => {
    console.log("SSH: Connection failed.");
});
global.ssh = ssh;
