inotifywait -m -r $1 -e create -e moved_to |
    while read path action file; do
        echo "The file '$file' appeared in directory '$path' via '$action'"
        # do something with the file
        # scp $path$file slate@prowebsoftware.redirectme.net:~/Documents/captures/$file
        if [[ $file =~ ^-?[0-9]+$ ]]
        then
          echo "${file} is an integer"
          scp $path$file slate@prowebsoftware.redirectme.net:~/Documents/captures/$file/
        else
            echo "${file} is not an integer"
          scp $path$file slate@prowebsoftware.redirectme.net:~/Documents/captures
        fi
    done