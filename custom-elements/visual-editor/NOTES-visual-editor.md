

TODO:
====
- hiearchical editing (goint "INTO" an object)
- cloning()
- linked cloning : geometry/shape/structure stays the same, but the new instance is a different node in the scene graph
  Two methods are possible :
    * keeping a single instance of the geometry/shape common to all instances: this is problematic because of three.js
 inability to swap out the contents of a geometry : you can alter the contents of the buffers, not resize them, which means
going through some sort of wrapper around the geometry (problematic, as far as my experiments have shown).
      Advantages: 
        * normally should be simple (no duplication, single geometry instance etc)
        * bi-directional (wherever the geometry is changed does not matter)
      Issues:
        * hard to get working (not there yet !)
        * how to handle mirroring etc ? or anything that should only be applied to a specific instance?

    * even dispatching: whenever the original changes, copies should as well)
      Advantages:
        * works !
        * less cumbersome workaround around limitations of three.js
      Issues:
        * only one sided (only original -> linked copy)

- improved visuals for meshes : litsphere can be a good "neutral" (not too dependant on lighting,
no dark areas) way of drawing meshes : see here for example : http://www.clicktorelease.com/code/spherical-normal-mapping/#

- more generic drag & drop support : should re-fire event so outer elements/pages can hook up to it( file upload ?)
- find a way to determine surface normal under mouse, to "glue" objects, with correct up vector , at the specified point/surface
- find a way to "snap" to elements (notably, connectors):
   * that might be a bit harder than expected: in order to do this, we need to search for "nearby" (close to mouse's 3d position)
   elements (connectors), which means storing the available connectors in a given scope (or perhaps use THREE.octree)


How to deal with:
- issue with lack of ability to swap out geometry with another one in three.js meshes:
 * do we need a "neutral wrapper" that does not directly contain geometry ?
- undo/redo of boolean operations :
 * store full geometry of object like it was before/after operations ? ->
could be very memory hungry
 * store diff/insersect etc and re apply a reversed boolean operation ? -> could be cpu hungry!




Additional notes:
-----------------
Some bad "suprises" regarding THREE.js:
 * mesh mirroring support is bad / unexisting:
   * applying matrix to mesh does not apply it to geometry (flipping positions in scene graph, but not geometry)
   * applying matrix to geometry foobars normals/winding order and needs hacks/workarounds


What we need:
-------------

- simple way to draw polylines visually
- import export : quick and easy, drag & drop : per part , per design (global)
- configurable base solids, configurable sub part
- visual "distance measurements" clicky here, clicky there, your distance is right there
- snap to : corners (edge intersections), edges , connectors
- actual saving of designs, ya know? 


Various ui behaviour notes:
---------------------------
- when creating a new shape, or executing an operation that creates a new shape
(extrusion etc), the new shape should become selected

- when deleting current selection we must:
 * detach the transform controls
 * reset the "context" menu to a neutral state
- when doing boolean operations:
  * make the right hand operands transparent for a few seconds, 
  make them normally visible afterwards
- various visual helpers that we need:
 * linked clone relationships display
 * parent <-> links display (not sure about this one)
 
 
 Notes about variables expressions and scopes
 --------------------------------------------
 - when entering values for something (position, rotation, scale, object attributes, you name it):
 we should also have access to the list of defined variables in the current scope/parent scope, 
 and have the ability to define new ones
 - how do we handle code that was generated from visuals, "augmented" with variables, classes etc:
 visual editing should not override any user defined elements
 
 Notes about 2d shape editing:
 -----------------------------
 - deleting a control point will require a workaround to generate "operations" (and to generated code from it)
 - all "stand ins for" should provide a way to compute to (an back) the ACTUAL operation that took place?
 
 Notes about code generation & regenerating from code:
 -----------------------------------------------------
  - generating the visual representation from code should only be done at the final step, no need to generate intermediary steps
  
 Notes about history generation/"operations" generation:
 -------------------------------------------------------
  - advantages of having objects/shapes generate their own list of operations:
   * works both for visual and from code generation
   * is more context specific : some operations (and their ability to generate code) need to be different based on
   what kind of shape we are in (something that can done only with lots of "if elses" etc when generated "from outside")
  
