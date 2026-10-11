# Public TLS test fixtures

`cert.pem` and `key.pem` are intentionally public, self-signed test material for `publisher.example`. The private key is a fixture, not a deployment credential. These files have no connection to a production account or server.

The local transport tests use them for loopback TLS origins and proxies, including the child-process test's `NODE_EXTRA_CA_CERTS`. They verify Host, SNI, trusted-CA behavior, and rejection of a mismatched hostname. No test sends this key to an external service.

Keep the fixture public and use it only in tests. Production code must never load it. Retaining a fixed pair keeps the offline tests portable without requiring an external certificate-generation tool.
