#!/usr/bin/env bash
read -r -p "Run package release? [y/N] " response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then

  echo "What type of update is this: major, minor, patch?"
  read version

  echo "Type your commit message:"
  read message

  V="$(npm --no-git-tag-version version $version -f)"

  # echo "********"
  # echo "==== starting changelog addition ===="

  # ex -sc "2i|{ "\"user\"": "\""$(git config user.name)"\"", "\"version\"": "\"$V\"", "\"commit\"": "\""$message"\"" }," -cx ./.storybook/changelog.json

  # echo "==== ending changelog addition ===="
  echo "********"
  echo "==== starting git logic ===="

  git add -A
  git commit -m "$message"
  git tag -a $V -m "$message"
  git push --tags

  echo "==== ending git logic ===="
fi