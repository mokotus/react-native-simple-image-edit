echo "Building..."
tsc
echo "Packing..."
mkdir simple-image-edit
cp -r dist package.json yarn.lock simple-image-edit/
tar -czvf simple-image-edit.tar.gz simple-image-edit
rm -r simple-image-edit
echo "Uploading..."
scp simple-image-edit.tar.gz root@s2p.fi:/home/miko/admin/webroot/insapp
echo "Done!"