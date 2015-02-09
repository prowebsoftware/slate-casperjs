inotifywait -m -r $1 -e create -e moved_to |
    while read path action file; do
        echo "The file '$file' appeared in directory '$path' via '$action'"
        # do something with the file

        # scp $path$file slate@prowebsoftware.redirectme.net:~/Documents/captures/$file

        if [[ $file =~ ^-?[0-9]+$ ]]
        then
            echo "${file} is an integer"
            ssh slate@prowebsoftware.redirectme.net "cd ~/Documents/captures/; mkdir ${file}"
        else
            echo "${file} is not an integer"
            dirname=$(echo $path | cut -d"/" -f7);
            echo "${dirname} is the dirname to copy to"
            scp $path$file "slate@prowebsoftware.redirectme.net:~/Documents/captures/${dirname}/"
        fi
    done