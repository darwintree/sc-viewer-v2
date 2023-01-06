prebuild:
ifeq ($(OS),Windows_NT)
	xcopy .\\CHANGELOG.md .\\public\\CHANGELOG.md /Y
else
	cp ./CHANGELOG.md ./public/CHANGELOG.md
endif
