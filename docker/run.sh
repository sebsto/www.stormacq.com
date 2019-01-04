docker run --rm -it -v $(pwd)/..:/app -p 4000:4000  sebsto/jekyll:3.8.5

# docker rm $(docker ps -a -q)