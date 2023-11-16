# Web File Browser - installation

These are the installation instructions for **Debian Linux** (logged in as root):

## 1. Run the following commands to download and create a settings file:

```bash
apt update
apt -y upgrade
apt -y install curl unzip git mariadb-server mariadb-client
curl -fsSL https://bun.sh/install | bash
source /root/.bashrc
git clone https://github.com/libersoft-org/web-file-browser.git
cd web-file-browser/src/
bun i
./start.sh --create-settings
```

## 2. Edit the "settings.json" file and set the following:
- **web**
  - **name** - the name of your website (in document title)
  - **standalone** - true / false
    - **true** means it will run a standalone web server with network port
    - **false** means you'll run it as a unix socket and connect it through other web server (**Nginx** is recommended)
  - **port** - your web server's network port (ignored if you're not running a standalone server)
  - **socket_path** - path to a unix socket file (ignored if you're running standalone server)

- **other**
  - **download** the path to the data you'd like to share on your website
  - **log_to_file** - if you'd like to log to console and log file (true) or to console only (false)
  - **log_file** - the path to your log file (ignored if log_to_file is false)

## 3. Set the NGINX site host config file

The following applies only for unix socket server. Skip this step if you're running standalone server.

If you don't have your Nginx web server installed, run this command:

```bash
apt install nginx
```

In **/etc/nginx/sites-available/**, create the new config file named by your domain name, ending with ".conf" extension (e.g.: your-server.com.conf).

For example:

```bash
nano /etc/nginx/sites-available/your-server.com.conf
```

The example of NGINX site host config file:

```conf
server {
 listen 80;
 listen [::]:80;
 server_name your-server.com *.your-server.com;

 location / {
  proxy_pass http://filebrowser;
 }
}

upstream filebrowser {
 server unix:/run/filebrowser.sock;
}
```

Now enable the site:

```bash
ln -s /etc/nginx/sites-available/your-server.com.conf /etc/nginx/sites-enabled/your-server.com.conf
```

Then restart the NGINX server:

```bash
service nginx restart
```

You can also add the HTTPS certificate using **certbot** if needed.

## 4. Start the server application

a) to start the server in **console** using **bun**:

```bash
./start.sh
```

b) to start the server in **console** by **bun** in **hot reload** (dev) mode:

```bash
./start-hot.sh
```

c) to start the server in **screen** by **bun**:

```bash
./start-screen.sh
```

d) to start the server in **screen** by **bun** in **hot reload** (dev) mode:

```bash
./start-hot-screen.sh
```

## 5. Open your web server address in your web broswer

- For example: **https://your-server.com/**
