#!/bin/bash
mkdir -p /var/www/html/super-secret-panel

# Write index.html hint
echo "Search engines don't always index everything." > /var/www/html/index.html

# Write robots.txt
cat <<EOF > /var/www/html/robots.txt
User-agent: *
Disallow: /super-secret-panel

# TODO: remove before production
# DEBUG: sensitive info present
EOF

# Write super secret panel with flag
cat <<EOF > /var/www/html/super-secret-panel/index.html
<h1>Admin Panel</h1>
<p>Restricted Area</p>
<p>Flag: ${FLAG}</p>
EOF

# Start Python HTTP server
exec python3 -m http.server 80 --directory /var/www/html
