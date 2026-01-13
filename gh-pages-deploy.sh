#!/bin/bash

# Configuration.
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/.out"
SITE_DIR="$SCRIPT_DIR/gh-pages"
BRANCH=main

# Working state.
COMMIT_DATE=$(git log -1 '--format=%cd' master)
DO_BUILD=0
DO_PUSH=1

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
  ! [ -d "$BUILD_DIR" ] && BUILD="EXEC"
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

  self::log "Copying exported files to gh-pages..."

  # Backup the files we want to preserve
  local BACKUP_DIR=$(mktemp -d)
  [ -f "$SITE_DIR/.git" ] && cp "$SITE_DIR/.git" "$BACKUP_DIR/.git"
  [ -f "$SITE_DIR/.nojekyll" ] && cp "$SITE_DIR/.nojekyll" "$BACKUP_DIR/.nojekyll"
  [ -f "$SITE_DIR/README.md" ] && cp "$SITE_DIR/README.md" "$BACKUP_DIR/README.md"
  [ -f "$SITE_DIR/CNAME" ] && cp "$SITE_DIR/CNAME" "$BACKUP_DIR/CNAME"

  # Clear gh-pages directory
  rm -rf "$SITE_DIR"/*
  rm -rf "$SITE_DIR"/.* 2>/dev/null || true

  # Copy exported site contents (note the trailing slash on .out/)
  rsync -av --delete "$BUILD_DIR/" "$SITE_DIR/"

  # Restore preserved files
  [ -f "$BACKUP_DIR/.git" ] && cp "$BACKUP_DIR/.git" "$SITE_DIR/.git"
  [ -f "$BACKUP_DIR/.nojekyll" ] && cp "$BACKUP_DIR/.nojekyll" "$SITE_DIR/.nojekyll"
  [ -f "$BACKUP_DIR/README.md" ] && cp "$BACKUP_DIR/README.md" "$SITE_DIR/README.md"
  [ -f "$BACKUP_DIR/CNAME" ] && cp "$BACKUP_DIR/CNAME" "$SITE_DIR/CNAME"

  rm -rf "$BACKUP_DIR"
  return $?
}

self::git_pull() {
  self::log "Pulling from submodule's $BRANCH branch..."
  cd "$SITE_DIR" &&
  git checkout $BRANCH &&
  git fetch
  return $?
}

self::git_commit_pages() {
  self::log "Committing to deployment submodule..."
  cd "$SITE_DIR" &&
  # Add and commit.
  git add . &&
  git commit -m "GitHub Pages deploy, as of $COMMIT_DATE."
  return $?
}

self::git_push_pages() {
  local EXIT_CODE=0
  if [ $DO_PUSH -eq 0 ]; then
    self::log "Pushing to submodule's $BRANCH branch..."
    cd "$SITE_DIR" &&
    git push origin main
    EXIT_CODE=$?
  fi
  return $EXIT_CODE
}

self::git_commit_project() {
  self::log "Committing to root repo..."
  cd "$SCRIPT_DIR" &&
  # Add and commit.
  git add gh-pages &&
  git commit -m "GitHub Pages submodule sync of $COMMIT_DATE."
  return $?
}

# We don't push the main repo intentionally, just in case there are
# other changes we need to handle first.

if ! self::process_args $@; then
  exit 1
elif ! self::git_pull; then
  self::err "Failed to checkout and pull!"
elif ! self::site_clean; then
  self::err "Failed to clean previous output!"
elif ! self::site_build; then
  self::err "Failed to build site!"
elif ! self::site_export; then
  self::err "Failed to export site!"
elif ! self::git_commit_pages; then
  self::err "Failed to commit GH Pages!"
elif ! self::git_push_pages; then
  self::err "Failed to push GH Pages!"
elif ! self::git_commit_project; then
  self::err "Failed to commit submodule to main repo!"
fi