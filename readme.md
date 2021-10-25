git config --global user.email "you@example.com"
git config --global user.name "Your Name"
Configuración de credenciales

git config --global --list
visualizar credenciales

git status
Visualizar los cambios efectuados dentro de la carpeta que contenga git

git diff
Visualizar los cambios realizados línea por línea

git add .
Agregar los archivos nuevos a GIT - área de preparación

git commit -am "mensaje"
git commit: Actualizar los cambios de mi local a la rama principal interna.
-a: Agregar los archivos
m: escribir un mensaje

git remote add origin URL_REPOSITORIO
agrega el url del repositorio en nube

git push origin master
Subir los cambios al repositorio

-----

git init
Inicializar git en la carpeta

git add .
Agregamos todos los archivos a git

git commit -m "Primer commit"
Mensaje para subir el primer commit

git remote add origin https
Se agrega el enlace para el repositorio remoto

git push -u origin master
subimos los cambios al repositorio
-u: Recordar mastes como origin

--

git log --all --decorate --oneline --graph
Visualización de cambios gráficamente.

gitk
ventana con cambios realizados

EN CASO DE EMERGENCIA
git pull --rebase origin master
confirmaciones locales además de la recién actualizada

--
CASO: Subir cambios
-------------------
Añadir cambios
git add .

Nombrar cambio
git commit -am "Aquí va la descripción del cambio que se hizo"

Empujar cambio al repo
git push origin master
 	o
git push origin desarrollo
-> master: Es el nombre de la rama en la que estás, puede ser otra

CASO: Actualizar cambios locales
--------------------------------
Traer cambios del repositorio
git pull

CASO: Cambiar nombre de commit
------------------------------
git commit --amend NOMBRE_DE_NUEVO_COMMIT
Modificar descripción de commit

CASO: Deshacer un cambio preparado
----------------------------------
git reset HEAD ARCHIVO_A_DESCARTAR
Descarta del área de preparación a archivo

CASO: Descartar cambios en un archivo
-------------------------------------
git checkout -- NOMBRE_DE_ARCHIVO
git restore NOMBRE_DE_ARCHIVO (recomendado)
Descartar cambios realizados a un determinado archivo.

CASO: Regresar al pasado :')
----------------------------
git checkout HASH_DEL_COMMIT
visualizar cambios de determinado commit

git reset --soft HASH_DEL_COMMIT
visualizar cambios de determinado commit, conservando los cambios de los commits siguientes

git reset --hard HASH_DEL_COMMIT
visualizar cambios de determinado commit, descartando los cambios de los commits siguientes

git push -f origin master
Actualiza repositorio en nube con el commit al cual apunt HEAD
-------------------------------------------------------------------------------------------------

CASO: Cambiar de rama
---------------------
Cambiar a rama "desarrollo"
git checkout desarrollo

CASO: Combinar cambios
-------------------------------------------------------------------
Combinar cambios de rama master con rama actual ('desarrollo')

Ir a rama 'desarrollo'
git checkout desarrollo

Traer cambios de 'master'
git merge origin master