#!/bin/bash
cd /home/kavia/workspace/code-generation/sudoku-web-solver-324663-324672/sudoku_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

