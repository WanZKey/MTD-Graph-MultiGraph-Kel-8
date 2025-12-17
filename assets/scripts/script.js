document.getElementById('process-btn').addEventListener('click', function() {
    const input = document.getElementById('graph-input').value.trim();
    if (!input) {
        alert('Masukkan input graf terlebih dahulu!');
        return;
    }
    
    // Ambil jenis graf dari radio button
    const graphType = document.querySelector('input[name="graph-type"]:checked').value;
    const isDirected = graphType === 'directed';
    
    // Parse input: split by comma, then by dash for edges
    const edges = input.split(',').map(edge => edge.trim().split('-')).filter(e => e.length === 2);
    
    // Collect unique nodes
    const nodes = new Set();
    edges.forEach(edge => {
        nodes.add(edge[0]);
        nodes.add(edge[1]);
    });
    
    // Prepare data for vis.js
    const visNodes = Array.from(nodes).map(node => ({ id: node, label: node }));
    const visEdges = edges.map(edge => ({ from: edge[0], to: edge[1] }));
    
    // Define options berdasarkan jenis graf
    const options = {
        nodes: { shape: 'circle', size: 30 },
        edges: isDirected ? { arrows: 'to' } : {},  // Directed: panah; Undirected: tanpa panah
        physics: { enabled: true }
    };
    
    // Create network
    const container = document.getElementById('graph-container');
    const data = { nodes: visNodes, edges: visEdges };
    new vis.Network(container, data, options);
    
    // Hitung dan tampilkan penjelasan graf
    const graphInfo = document.getElementById('graph-info');
    
    // Jumlah simpul dan sisi
    const numNodes = nodes.size;
    const numEdges = edges.length;
    
    // Hitung derajat simpul (untuk undirected: degree; untuk directed: in-degree dan out-degree)
    const inDegrees = {};
    const outDegrees = {};
    nodes.forEach(node => {
        inDegrees[node] = 0;
        outDegrees[node] = 0;
    });
    edges.forEach(edge => {
        outDegrees[edge[0]]++;
        inDegrees[edge[1]]++;
    });
    
    // Cek sisi ganda (multiple edges)
    const edgeCount = {};
    edges.forEach(edge => {
        const key = isDirected ? `${edge[0]}-${edge[1]}` : [edge[0], edge[1]].sort().join('-');
        edgeCount[key] = (edgeCount[key] || 0) + 1;
    });
    const multipleEdges = Object.entries(edgeCount).filter(([key, count]) => count > 1);
    const hasMultipleEdges = multipleEdges.length > 0;
    
    // Cek sisi loop (self-loops)
    const selfLoops = edges.filter(edge => edge[0] === edge[1]);
    const hasSelfLoops = selfLoops.length > 0;
    
    // Cek konektivitas (untuk undirected: connected; untuk directed: strongly connected - sederhana dengan DFS)
    const adjacencyList = {};
    nodes.forEach(node => adjacencyList[node] = []);
    edges.forEach(edge => {
        adjacencyList[edge[0]].push(edge[1]);
        if (!isDirected) adjacencyList[edge[1]].push(edge[0]);  // Untuk undirected, tambahkan balik
    });
    
    const visited = new Set();
    function dfs(node) {
        visited.add(node);
        adjacencyList[node].forEach(neighbor => {
            if (!visited.has(neighbor)) dfs(neighbor);
        });
    }
    if (numNodes > 0) dfs(Array.from(nodes)[0]);
    const isConnected = visited.size === numNodes;
    
    // Klasifikasi untuk undirected: simple atau multigraph
    let classification = '';
    if (!isDirected) {
        if (!hasMultipleEdges && !hasSelfLoops) {
            classification = 'Graf Sederhana (Simple Graph)';
        } else {
            classification = 'Multigraf (Multigraph)';
        }
    }
    
    // Nampil informasi 
    graphInfo.innerHTML = `
        <h3>Penjelasan Graf</h3>
        <p><strong>Jenis Graf:</strong> ${isDirected ? 'Berarah (Directed)' : 'Tak Berarah (Undirected)'}</p>
        ${!isDirected ? `<p><strong>Klasifikasi:</strong> ${classification}</p>` : ''}
        <p><strong>Jumlah Simpul:</strong> ${numNodes}</p>
        <p><strong>Jumlah Sisi:</strong> ${numEdges}</p>
        <p><strong>Derajat Simpul:</strong></p>
        <ul>
            ${Array.from(nodes).map(node => {
                const inDeg = inDegrees[node];
                const outDeg = outDegrees[node];
                return `<li>${node}: ${isDirected ? `In-degree: ${inDeg}, Out-degree: ${outDeg}` : `Degree: ${inDeg + outDeg}`}</li>`;
            }).join('')}
        </ul>
        <p><strong>Sisi Ganda (Multiple Edges):</strong> ${hasMultipleEdges ? 'Ya' : 'Tidak'}</p>
        ${hasMultipleEdges ? `<ul>${multipleEdges.map(([key, count]) => `<li>${key}: ${count} sisi</li>`).join('')}</ul>` : ''}
        <p><strong>Sisi Loop (Self-Loops):</strong> ${hasSelfLoops ? 'Ya' : 'Tidak'}</p>
        ${hasSelfLoops ? `<ul>${selfLoops.map(edge => `<li>${edge[0]}-${edge[1]}</li>`).join('')}</ul>` : ''}
        <p><strong>Konektivitas:</strong> ${isDirected ? (isConnected ? 'Graf strongly connected' : 'Graf tidak strongly connected') : (isConnected ? 'Graf terhubung' : 'Graf tidak terhubung')}</p>
    `;
});