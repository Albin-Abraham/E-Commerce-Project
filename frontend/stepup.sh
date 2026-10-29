# 1️⃣ Install nvm and load it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2️⃣ Install Node 20 LTS (v20.19+) and set default
nvm install 20 && nvm use 20 && nvm alias default 20

# 3️⃣ Navigate to your project folder
cd ~/Project/react-vite/frontend

# 4️⃣ Clean old dependencies
rm -rf node_modules package-lock.json

# 5️⃣ Reinstall dependencies fresh
npm install

# 6️⃣ Run Vite dev server
npm run dev
