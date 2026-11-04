/**
 * Nghiệp vụ ecom của DownBeat. Mỗi chức năng một package con:
 * {@code vn.aeoc.business.<chuc_nang>.{controller,service,repository}}.
 * Controller kế thừa {@code vn.aeoc.authenticate.controller.BaseController} và gọi
 * {@code checkPermission(principal, URI, action)} trước khi xử lý.
 */
package vn.aeoc.business;
