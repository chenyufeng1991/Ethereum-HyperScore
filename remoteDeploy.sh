# /bin/bash

# 自动化部署脚本
node ./public/javascripts/utils/ethereumUtils/deployContract.js

#启动服务
sudo forever start ./app.js

