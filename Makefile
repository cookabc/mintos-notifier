deploy:
	rsync -avz --progress --stats --delete ./* --exclude 'node_modules' root@47.104.61.39:/data/nodejs/mintos-notify