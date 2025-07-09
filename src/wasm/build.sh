#!/bin/bash

# Build the WASM module
echo "Building Solar System WASM module..."

# Install wasm-pack if not installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM package
wasm-pack build --target web --out-dir pkg --release

# Copy the generated files to the appropriate directory
mkdir -p ../utils/wasm
cp pkg/*.wasm ../utils/wasm/
cp pkg/*.js ../utils/wasm/
cp pkg/*.ts ../utils/wasm/

echo "WASM module built successfully!"
echo "Files generated in src/utils/wasm/" 