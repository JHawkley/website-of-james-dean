#!/bin/bash

# Configuration.
BUILD_DIR=.next
SITE_DIR=gh-pages
BRANCH=gh-pages
DOMAIN=jamesdean.me

# Working state.
COMMIT_DATE=$(git log -1 '--format=%cd' master)
DO_BUILD=0
DO_PUSH=1
MADE_WORKTREE=1

self::log() { echo -e "\033[0;32m$1\033[0m"; }
self::err() { echo -e "\033[0;31m$1\033[0m"; }

self::process_args() {
  local EXIT_CODE=0
  local EXEC=0
  local SKIP=1

  local BUILD="EXEC"
  local PUSH="SKIP"
  local ARG=$1

  while [ $EXIT_CODE -eq 0 ] && ! [ "$ARG" = "" ]; do
    case $ARG in
      "--no-build" )
        BUILD="SKIP";;
      "--push" )
        PUSH="EXEC";;
      *)
        self::err "Unknown argument: $ARG"
        EXIT_CODE=1;;
    esac

    shift
    ARG=$1
  done

  # If the build directory doesn't exist, we must do a build.
  ! [ -d $BUILD_DIR ] && BUILD="EXEC"
  DO_BUILD=${!BUILD}
  DO_PUSH=${!PUSH}

  return $EXIT_CODE
}

self::site_clean() {
  self::log "Cleaning previous output..."
  yarn run export:clean
  return $?
}

self::site_build() {
  local EXIT_CODE=0
  if [ $DO_BUILD -eq 0 ]; then
    self::log "Building site..."
    yarn run build
    EXIT_CODE=$?
  fi
  return $EXIT_CODE
}

self::site_export() {
  self::log "Exporting site..."
  yarn run export:only
  return $?
}

self::git_make_tree() {
  local EXIT_CODE=0
  self::log "Creating $BRANCH work-tree..."
  git worktree add $SITE_DIR $BRANCH
  EXIT_CODE=$?
  [ $EXIT_CODE -eq 0 ] && MADE_WORKTREE=0
  return $EXIT_CODE
}

self::git_commit() {
  self::log "Committing $BRANCH branch..."
  cd $SITE_DIR &&
  # Restore .git; next export usually deletes it.
  [ -f .git ] || echo "gitdir: $(git rev-parse --show-toplevel)/.git/worktrees/$SITE_DIR" > .git &&
  # Create the .nojekyll file.
  touch .nojekyll &&
  # Create the CNAME file.
  [ -f CNAME ] || echo "$DOMAIN" > CNAME &&
  # Add and commit.
  git add . &&
  git commit -m "GitHub Pages deploy, as of $COMMIT_DATE."
  return $?
}

self::git_push() {
  local EXIT_CODE=0
  if [ $DO_PUSH -eq 0 ]; then
    self::log "Pushing $BRANCH to origin/$BRANCH..."
    git push origin $BRANCH
    EXIT_CODE=$?
  fi
  return $EXIT_CODE
}

self::git_clean() {
  self::log "Removing $BRANCH work-tree..."
  git worktree remove $SITE_DIR
  return $?
}

if ! self::process_args $@; then
  exit 1
elif ! self::site_clean; then
  self::err "Failed to clean previous output!"
elif ! self::git_make_tree; then
  self::err "Failed to create work-tree!"
elif ! self::site_build; then
  self::err "Failed to build site!"
elif ! self::site_export; then
  self::err "Failed to export site!"
elif ! self::git_commit; then
  self::err "Failed to commit!"
elif ! self::git_push; then
  self::err "Failed to push!"
fi

if [ $MADE_WORKTREE -eq 0 ] && ! self::git_clean; then
  self::err "Failed to remove work-tree!"
  exit 1
fi